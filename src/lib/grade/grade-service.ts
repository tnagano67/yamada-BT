import { prisma } from "@/lib/db/prisma";
import type { Subject } from "@/generated/prisma/client";
import {
  getInitialGradeId,
  calculatePromotionUpdate,
  isMaxGrade,
} from "./promotion";
import { CONSECUTIVE_PASSES_REQUIRED } from "./constants";
import type { PromotionUpdateResult, GradeProgressData } from "./types";

/**
 * 生徒のグレードが未存在なら初期グレードで作成する（upsert）
 * PromotionProgressも同時作成する
 */
export async function ensureStudentGrade(
  studentId: string,
  subject: Subject,
): Promise<{ currentGradeId: string }> {
  const initialGradeId = getInitialGradeId(subject);

  const studentGrade = await prisma.studentGrade.upsert({
    where: {
      studentId_subject: { studentId, subject },
    },
    create: {
      studentId,
      subject,
      currentGradeId: initialGradeId,
    },
    update: {},
    select: { currentGradeId: true },
  });

  // PromotionProgressも確保
  await prisma.promotionProgress.upsert({
    where: {
      studentId_subject: { studentId, subject },
    },
    create: {
      studentId,
      subject,
      targetGradeId: studentGrade.currentGradeId,
    },
    update: {},
  });

  return studentGrade;
}

/**
 * クイズ結果を受けて昇格処理を実行する
 *
 * 1. PromotionProgress を upsert
 * 2. calculatePromotionUpdate() で昇格判定
 * 3. 昇格時: StudentGrade 更新、PromotionProgress リセット
 * 4. 非昇格時: consecutivePasses のみ更新
 * 5. Prisma $transaction でアトミック実行
 */
export async function processQuizResultForPromotion(
  studentId: string,
  subject: Subject,
  currentGradeId: string,
  isPassed: boolean,
): Promise<PromotionUpdateResult> {
  return prisma.$transaction(async (tx) => {
    // 現在の PromotionProgress を取得 or 作成
    const progress = await tx.promotionProgress.upsert({
      where: {
        studentId_subject: { studentId, subject },
      },
      create: {
        studentId,
        subject,
        targetGradeId: currentGradeId,
        consecutivePasses: 0,
        attemptsToday: 0,
      },
      update: {},
    });

    // 昇格計算
    const result = calculatePromotionUpdate(
      progress.consecutivePasses,
      isPassed,
      currentGradeId,
    );

    if (result.shouldPromote && result.newGradeId) {
      // 昇格: StudentGrade 更新 + PromotionProgress リセット
      await tx.studentGrade.update({
        where: {
          studentId_subject: { studentId, subject },
        },
        data: {
          currentGradeId: result.newGradeId,
          promotedAt: new Date(),
        },
      });

      await tx.promotionProgress.update({
        where: {
          studentId_subject: { studentId, subject },
        },
        data: {
          consecutivePasses: 0,
          targetGradeId: result.newGradeId,
          attemptsToday: progress.attemptsToday + 1,
          lastPassAt: isPassed ? new Date() : progress.lastPassAt,
        },
      });
    } else {
      // 非昇格: consecutivePasses のみ更新
      await tx.promotionProgress.update({
        where: {
          studentId_subject: { studentId, subject },
        },
        data: {
          consecutivePasses: result.newConsecutivePasses,
          attemptsToday: progress.attemptsToday + 1,
          lastPassAt: isPassed ? new Date() : progress.lastPassAt,
        },
      });
    }

    return result;
  });
}

/**
 * ダッシュボード表示用のグレード進捗データを取得する
 */
export async function getGradeProgressData(
  studentId: string,
  subject: Subject,
): Promise<GradeProgressData | null> {
  const [studentGrade, promotionProgress] = await Promise.all([
    prisma.studentGrade.findUnique({
      where: {
        studentId_subject: { studentId, subject },
      },
      include: {
        currentGrade: {
          select: { gradeType: true },
        },
      },
    }),
    prisma.promotionProgress.findUnique({
      where: {
        studentId_subject: { studentId, subject },
      },
    }),
  ]);

  if (!studentGrade) return null;

  return {
    currentGradeId: studentGrade.currentGradeId,
    subject: studentGrade.subject,
    gradeType: studentGrade.currentGrade.gradeType,
    consecutivePasses: promotionProgress?.consecutivePasses ?? 0,
    requiredPasses: CONSECUTIVE_PASSES_REQUIRED,
    isMaxGrade: isMaxGrade(studentGrade.currentGradeId),
    promotedAt: studentGrade.promotedAt,
  };
}

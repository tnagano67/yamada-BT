import { prisma } from "@/lib/db/prisma";
import { todayJST } from "@/lib/date-utils";
import { detectAlerts } from "./detector";
import type { AlertConditionInput } from "./types";

interface AlertSummary {
  high: number;
  medium: number;
  low: number;
}

/**
 * 教員の担当クラスの全生徒を評価し、新規アラートを生成する
 */
export async function generateAlertsForTeacher(
  teacherId: string,
): Promise<number> {
  const today = todayJST();

  // 担当クラスの生徒を取得
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { teacherId },
    select: {
      class: {
        select: {
          classStudents: {
            where: { status: "active" },
            select: {
              student: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  const studentIds = new Set<string>();
  const studentMap = new Map<string, string>();
  for (const a of assignments) {
    for (const cs of a.class.classStudents) {
      studentIds.add(cs.student.id);
      studentMap.set(cs.student.id, cs.student.name ?? "名前未設定");
    }
  }

  if (studentIds.size === 0) return 0;

  // 各生徒の既存の未確認アラートを取得(重複チェック用)
  const existingAlerts = await prisma.teacherAlert.findMany({
    where: {
      teacherId,
      isAcknowledged: false,
      studentId: { in: [...studentIds] },
    },
    select: { studentId: true, alertType: true },
  });
  const existingSet = new Set(
    existingAlerts.map((a) => `${a.studentId}:${a.alertType}`),
  );

  let createdCount = 0;

  for (const studentId of studentIds) {
    const input = await buildAlertConditionInput(
      studentId,
      studentMap.get(studentId) ?? "名前未設定",
      today,
    );

    const detected = detectAlerts(input);

    for (const alert of detected) {
      const key = `${alert.studentId}:${alert.alertType}`;
      if (existingSet.has(key)) continue;

      await prisma.teacherAlert.create({
        data: {
          teacherId,
          studentId: alert.studentId,
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
        },
      });
      existingSet.add(key);
      createdCount++;
    }
  }

  return createdCount;
}

/**
 * 未確認アラートを取得する (severity順)
 */
export async function getUnacknowledgedAlerts(teacherId: string) {
  return prisma.teacherAlert.findMany({
    where: {
      teacherId,
      isAcknowledged: false,
    },
    include: {
      student: {
        select: { id: true, name: true, nameKana: true },
      },
    },
    orderBy: [
      { severity: "asc" }, // high < medium < low in enum order
      { createdAt: "desc" },
    ],
  });
}

/**
 * アラートを確認済みにする
 */
export async function acknowledgeAlert(
  alertId: string,
  teacherId: string,
): Promise<boolean> {
  const alert = await prisma.teacherAlert.findFirst({
    where: { id: alertId, teacherId },
  });
  if (!alert) return false;

  await prisma.teacherAlert.update({
    where: { id: alertId },
    data: { isAcknowledged: true },
  });
  return true;
}

/**
 * アラートサマリーを取得する
 */
export async function getAlertSummary(
  teacherId: string,
): Promise<AlertSummary> {
  const alerts = await prisma.teacherAlert.findMany({
    where: { teacherId, isAcknowledged: false },
    select: { severity: true },
  });

  const summary: AlertSummary = { high: 0, medium: 0, low: 0 };
  for (const a of alerts) {
    summary[a.severity]++;
  }
  return summary;
}

/**
 * 生徒の状態からAlertConditionInputを構築する
 */
async function buildAlertConditionInput(
  studentId: string,
  studentName: string,
  evaluationDate: Date,
): Promise<AlertConditionInput> {
  const thirtyDaysAgo = new Date(evaluationDate);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    morningAttempts,
    recentDeliveries,
    weeklyAttempts,
    streak,
    promotionAttempts,
    selfStudyAttempt,
    semesterGoal,
  ] = await Promise.all([
    // 直近の朝テスト受験
    prisma.quizAttempt.findMany({
      where: {
        studentId,
        mode: "morning_test",
        submittedAt: { not: null },
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    }),
    // 直近の配信日
    prisma.quizDelivery.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        status: { in: ["active", "closed"] },
      },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    // 週別正答率計算用の朝テスト
    prisma.quizAttempt.findMany({
      where: {
        studentId,
        mode: "morning_test",
        submittedAt: { not: null },
        scorePercentage: { not: null },
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true, scorePercentage: true },
      orderBy: { startedAt: "desc" },
    }),
    // ストリーク
    prisma.studentStreak.findUnique({
      where: { studentId },
      select: { currentStreak: true, maxStreak: true },
    }),
    // 直近の昇格テスト結果
    prisma.quizAttempt.findMany({
      where: {
        studentId,
        mode: { in: ["promotion", "morning_test"] },
        submittedAt: { not: null },
        isPassed: { not: null },
      },
      select: { isPassed: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    // 最後の自学自習
    prisma.quizAttempt.findFirst({
      where: {
        studentId,
        mode: { in: ["quick", "promotion"] },
        submittedAt: { not: null },
      },
      select: { submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
    // 学期目標
    prisma.semesterGoal.findFirst({
      where: { studentId, status: "in_progress" },
      include: {
        semester: true,
        targetGrade: { select: { gradeNumber: true, subject: true } },
      },
    }),
  ]);

  // 朝テスト受験日リスト (日付部分のみ、降順)
  const recentMorningTestDates = morningAttempts.map((a) => {
    const d = new Date(a.startedAt);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  });

  // 配信日リスト (降順)
  const recentDeliveryDates = recentDeliveries.map((d) => d.date);

  // 週別正答率 (最新週が先頭)
  const weeklyAccuracies = calculateWeeklyAccuracies(
    weeklyAttempts.map((a) => ({
      date: a.startedAt,
      score: a.scorePercentage!,
    })),
    evaluationDate,
  );

  // ストリーク情報
  const previousStreak =
    streak && streak.maxStreak > streak.currentStreak
      ? streak.maxStreak
      : null;
  const currentStreak = streak?.currentStreak ?? 0;

  // 昇格テスト結果
  const recentPromotionResults = promotionAttempts.map(
    (a) => a.isPassed!,
  );

  // 自学自習の最終日
  const lastSelfStudyDate = selfStudyAttempt?.submittedAt ?? null;

  // 学期目標進捗
  let goalProgressPercent: number | null = null;
  let semesterProgressPercent = 0;
  if (semesterGoal) {
    // 現在のグレードから目標までの進捗を概算
    const studentGrade = await prisma.studentGrade.findUnique({
      where: {
        studentId_subject: {
          studentId,
          subject: semesterGoal.targetGrade.subject,
        },
      },
      include: { currentGrade: { select: { gradeNumber: true } } },
    });

    if (studentGrade) {
      const current = studentGrade.currentGrade.gradeNumber;
      const target = semesterGoal.targetGrade.gradeNumber;
      goalProgressPercent =
        target > current
          ? Math.round((current / target) * 100)
          : 100;
    }

    // 学期進捗率
    const semesterStart = semesterGoal.semester.startDate.getTime();
    const semesterEnd = semesterGoal.semester.endDate.getTime();
    const now = evaluationDate.getTime();
    if (semesterEnd > semesterStart) {
      semesterProgressPercent = Math.round(
        ((now - semesterStart) / (semesterEnd - semesterStart)) * 100,
      );
      semesterProgressPercent = Math.min(100, Math.max(0, semesterProgressPercent));
    }
  }

  return {
    studentId,
    studentName,
    recentMorningTestDates,
    recentDeliveryDates,
    weeklyAccuracies,
    goalProgressPercent,
    semesterProgressPercent,
    previousStreak,
    currentStreak,
    recentPromotionResults,
    lastSelfStudyDate,
    evaluationDate,
  };
}

/**
 * 週別正答率を計算する (最新週が先頭)
 */
function calculateWeeklyAccuracies(
  attempts: { date: Date; score: number }[],
  evaluationDate: Date,
): number[] {
  if (attempts.length === 0) return [];

  const weeklyScores: Map<number, number[]> = new Map();

  for (const a of attempts) {
    const diffMs = evaluationDate.getTime() - a.date.getTime();
    const weekIndex = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    const existing = weeklyScores.get(weekIndex) ?? [];
    existing.push(a.score);
    weeklyScores.set(weekIndex, existing);
  }

  const maxWeek = Math.max(...weeklyScores.keys());
  const result: number[] = [];
  for (let i = 0; i <= Math.min(maxWeek, 3); i++) {
    const scores = weeklyScores.get(i);
    if (scores && scores.length > 0) {
      result.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
    }
  }

  return result;
}

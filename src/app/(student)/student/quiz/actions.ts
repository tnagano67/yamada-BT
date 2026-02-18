"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { generateQuiz } from "@/lib/quiz/generator";
import { calculateScore } from "@/lib/quiz/scorer";
import {
  ensureStudentGrade,
  processQuizResultForPromotion,
} from "@/lib/grade/grade-service";
import type { QuizMode } from "@/generated/prisma/client";
import type { AnswerFeedback } from "@/lib/quiz/types";

/**
 * クイズを開始する
 * 1. 問題を自動生成
 * 2. QuizAttempt + QuizAnswer をDB作成
 * 3. クイズページへリダイレクト
 */
export async function startQuiz(
  mode: QuizMode,
  deliveryId?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("認証が必要です");

  const userId = session.user.id;

  // 生徒のグレードを取得（未存在ならE1で初期化）
  const studentGrade = await ensureStudentGrade(userId, "english");

  // 朝テストモードの場合、配信を検証
  if (mode === "morning_test" && deliveryId) {
    const delivery = await prisma.quizDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery || delivery.status !== "active") {
      throw new Error("有効な配信が見つかりません");
    }

    // 既に受験済みか確認
    const existing = await prisma.quizAttempt.findFirst({
      where: {
        studentId: userId,
        deliveryId,
        submittedAt: { not: null },
      },
    });
    if (existing) {
      throw new Error("このテストは既に受験済みです");
    }
  }

  // 問題を自動生成
  const quiz = await generateQuiz(studentGrade.currentGradeId, mode);

  // QuizAttempt を作成
  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId: userId,
      gradeId: quiz.gradeId,
      mode: quiz.mode,
      deliveryId: deliveryId ?? null,
      answers: {
        create: quiz.questions.map((q) => ({
          wordId: q.wordId,
          questionDirection: q.direction,
          correctOption: q.correctOption,
          allOptions: q.options,
        })),
      },
    },
  });

  redirect(`/student/quiz/${attempt.id}`);
}

/**
 * 回答を送信する
 * 正誤判定 + 即時フィードバック返却
 */
export async function submitAnswer(
  attemptId: string,
  answerId: string,
  selectedOption: string,
  timeSpentMs: number,
): Promise<AnswerFeedback> {
  const session = await auth();
  if (!session?.user) throw new Error("認証が必要です");

  // 本人確認
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { studentId: true, submittedAt: true },
  });
  if (!attempt || attempt.studentId !== session.user.id) {
    throw new Error("不正なアクセスです");
  }
  if (attempt.submittedAt) {
    throw new Error("このクイズは既に提出済みです");
  }

  // 回答を取得して正誤判定
  const answer = await prisma.quizAnswer.findUnique({
    where: { id: answerId },
    select: { correctOption: true, attemptId: true },
  });
  if (!answer || answer.attemptId !== attemptId) {
    throw new Error("不正な回答IDです");
  }

  const isCorrect = selectedOption === answer.correctOption;

  // 回答を保存
  await prisma.quizAnswer.update({
    where: { id: answerId },
    data: {
      selectedOption,
      isCorrect,
      timeSpentMs,
      answeredAt: new Date(),
    },
  });

  return {
    isCorrect,
    correctOption: answer.correctOption,
  };
}

/**
 * クイズを完了する
 * 採点 → スコア保存 → 結果ページへリダイレクト
 */
export async function completeQuiz(attemptId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("認証が必要です");

  // 本人確認
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        select: { isCorrect: true },
      },
      grade: {
        select: { subject: true },
      },
    },
  });
  if (!attempt || attempt.studentId !== session.user.id) {
    throw new Error("不正なアクセスです");
  }
  if (attempt.submittedAt) {
    throw new Error("このクイズは既に提出済みです");
  }

  // 採点
  const scoreResult = calculateScore(attempt.answers);

  // スコアを保存
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      score: scoreResult.correctCount,
      scorePercentage: scoreResult.scorePercentage,
      isPassed: scoreResult.isPassed,
    },
  });

  // 昇格処理
  const promotionResult = await processQuizResultForPromotion(
    session.user.id,
    attempt.grade.subject,
    attempt.gradeId,
    scoreResult.isPassed,
  );

  // リダイレクト（昇格情報をクエリパラメータで付与）
  const params = new URLSearchParams();
  if (promotionResult.shouldPromote && promotionResult.newGradeId) {
    params.set("promoted", "1");
    params.set("newGrade", promotionResult.newGradeId);
  }
  const query = params.toString();
  redirect(`/student/quiz/${attemptId}/result${query ? `?${query}` : ""}`);
}

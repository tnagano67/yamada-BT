import { PASS_THRESHOLD_PERCENT } from "./constants";
import type { ScoreResult } from "./types";

/**
 * 回答リストから採点結果を計算する純粋関数
 */
export function calculateScore(
  answers: { isCorrect: boolean | null }[],
): ScoreResult {
  const totalQuestions = answers.length;
  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      correctCount: 0,
      scorePercentage: 0,
      isPassed: false,
    };
  }

  const correctCount = answers.filter((a) => a.isCorrect === true).length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = scorePercentage >= PASS_THRESHOLD_PERCENT;

  return {
    totalQuestions,
    correctCount,
    scorePercentage,
    isPassed,
  };
}

import { CONSECUTIVE_PASSES_REQUIRED } from "@/lib/grade/constants";

export type RecommendationType = "promotion_close" | "review_wrong" | "daily_quick";

export interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  suggestedMode: "promotion" | "quick";
}

export interface RecommendationInput {
  consecutivePasses: number;
  promotionAttemptsRemaining: number;
  incorrectWordCount: number;
  hasStudiedToday: boolean;
  isMaxGrade: boolean;
}

/**
 * 学習おすすめを判定する（純粋関数）
 *
 * 優先順位:
 * 1. 連続合格2回 & 残り回数あり → 「あと1回で昇格！」
 * 2. 誤答多数 → 「苦手単語を復習」
 * 3. 今日未学習 → 「クイック練習をやろう」
 */
export function getRecommendation(
  input: RecommendationInput,
): Recommendation | null {
  const {
    consecutivePasses,
    promotionAttemptsRemaining,
    incorrectWordCount,
    hasStudiedToday,
    isMaxGrade,
  } = input;

  // 1. 連続合格が2回（あと1回で昇格）& 昇格チャレンジ残りあり & 最大グレードでない
  if (
    consecutivePasses === CONSECUTIVE_PASSES_REQUIRED - 1 &&
    promotionAttemptsRemaining > 0 &&
    !isMaxGrade
  ) {
    return {
      type: "promotion_close",
      title: "あと1回で昇格！",
      description: "昇格チャレンジに挑戦して次のグレードに進もう！",
      suggestedMode: "promotion",
    };
  }

  // 2. 誤答が5問以上
  if (incorrectWordCount >= 5) {
    return {
      type: "review_wrong",
      title: "苦手単語を復習しよう",
      description: `${incorrectWordCount}問の間違えた単語があります。クイック練習で復習しましょう！`,
      suggestedMode: "quick",
    };
  }

  // 3. 今日未学習
  if (!hasStudiedToday) {
    return {
      type: "daily_quick",
      title: "今日の練習をしよう！",
      description: "クイック練習で英単語力をキープしよう！",
      suggestedMode: "quick",
    };
  }

  return null;
}

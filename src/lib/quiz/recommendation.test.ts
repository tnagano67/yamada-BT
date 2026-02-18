import { describe, it, expect } from "vitest";
import { getRecommendation, type RecommendationInput } from "./recommendation";

const baseInput: RecommendationInput = {
  consecutivePasses: 0,
  promotionAttemptsRemaining: 3,
  incorrectWordCount: 0,
  hasStudiedToday: false,
  isMaxGrade: false,
};

describe("getRecommendation", () => {
  it("連続合格2回 + 残り回数あり → 昇格チャレンジ推奨", () => {
    const result = getRecommendation({
      ...baseInput,
      consecutivePasses: 2,
      promotionAttemptsRemaining: 2,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("promotion_close");
    expect(result!.suggestedMode).toBe("promotion");
  });

  it("連続合格2回だが残り回数0 → 昇格推奨しない", () => {
    const result = getRecommendation({
      ...baseInput,
      consecutivePasses: 2,
      promotionAttemptsRemaining: 0,
      hasStudiedToday: true,
    });
    expect(result).toBeNull();
  });

  it("連続合格2回だが最大グレード → 昇格推奨しない", () => {
    const result = getRecommendation({
      ...baseInput,
      consecutivePasses: 2,
      promotionAttemptsRemaining: 3,
      isMaxGrade: true,
      incorrectWordCount: 0,
      hasStudiedToday: true,
    });
    expect(result).toBeNull();
  });

  it("誤答5問以上 → 苦手復習推奨", () => {
    const result = getRecommendation({
      ...baseInput,
      incorrectWordCount: 8,
      hasStudiedToday: true,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("review_wrong");
    expect(result!.suggestedMode).toBe("quick");
  });

  it("今日未学習 → クイック練習推奨", () => {
    const result = getRecommendation({
      ...baseInput,
      hasStudiedToday: false,
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("daily_quick");
    expect(result!.suggestedMode).toBe("quick");
  });

  it("昇格チャレンジが最優先される", () => {
    const result = getRecommendation({
      ...baseInput,
      consecutivePasses: 2,
      promotionAttemptsRemaining: 1,
      incorrectWordCount: 10,
      hasStudiedToday: false,
    });
    expect(result!.type).toBe("promotion_close");
  });

  it("誤答復習は未学習より優先される", () => {
    const result = getRecommendation({
      ...baseInput,
      incorrectWordCount: 6,
      hasStudiedToday: false,
    });
    expect(result!.type).toBe("review_wrong");
  });

  it("すべて条件を満たさない → null", () => {
    const result = getRecommendation({
      ...baseInput,
      hasStudiedToday: true,
      incorrectWordCount: 0,
    });
    expect(result).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { calculateScore } from "@/lib/quiz/scorer";
import { calculatePromotionUpdate } from "@/lib/grade/promotion";
import { CONSECUTIVE_PASSES_REQUIRED } from "@/lib/grade/constants";

describe("採点→昇格の連携テスト", () => {
  it("80%合格 → 昇格進捗が1増加", () => {
    // 10問中8問正解 → 80% → 合格
    const answers = [
      ...Array(8).fill({ isCorrect: true }),
      ...Array(2).fill({ isCorrect: false }),
    ];
    const score = calculateScore(answers);
    expect(score.isPassed).toBe(true);
    expect(score.scorePercentage).toBe(80);

    // 連続合格0から1へ
    const result = calculatePromotionUpdate(0, score.isPassed, "E5");
    expect(result.newConsecutivePasses).toBe(1);
    expect(result.shouldPromote).toBe(false);
  });

  it("70%不合格 → 昇格進捗リセット", () => {
    // 10問中7問正解 → 70% → 不合格
    const answers = [
      ...Array(7).fill({ isCorrect: true }),
      ...Array(3).fill({ isCorrect: false }),
    ];
    const score = calculateScore(answers);
    expect(score.isPassed).toBe(false);
    expect(score.scorePercentage).toBe(70);

    // 連続合格2からリセット
    const result = calculatePromotionUpdate(2, score.isPassed, "E5");
    expect(result.newConsecutivePasses).toBe(0);
    expect(result.shouldPromote).toBe(false);
  });

  it("3回連続合格 → 昇格", () => {
    // 各回100%合格
    const answers = Array(10).fill({ isCorrect: true });
    const score = calculateScore(answers);
    expect(score.isPassed).toBe(true);

    // 連続合格2の状態で3回目の合格
    const result = calculatePromotionUpdate(
      CONSECUTIVE_PASSES_REQUIRED - 1,
      score.isPassed,
      "E5",
    );
    expect(result.shouldPromote).toBe(true);
    expect(result.newGradeId).toBe("E6");
    expect(result.newConsecutivePasses).toBe(0);
  });

  it("最高グレードでは昇格しない", () => {
    const answers = Array(10).fill({ isCorrect: true });
    const score = calculateScore(answers);

    const result = calculatePromotionUpdate(
      CONSECUTIVE_PASSES_REQUIRED - 1,
      score.isPassed,
      "E48",
    );
    expect(result.shouldPromote).toBe(false);
    expect(result.newGradeId).toBeNull();
    expect(result.newConsecutivePasses).toBe(CONSECUTIVE_PASSES_REQUIRED);
  });

  it("日本語の昇格も正しく動作", () => {
    const answers = Array(10).fill({ isCorrect: true });
    const score = calculateScore(answers);

    const result = calculatePromotionUpdate(
      CONSECUTIVE_PASSES_REQUIRED - 1,
      score.isPassed,
      "J10",
    );
    expect(result.shouldPromote).toBe(true);
    expect(result.newGradeId).toBe("J11");
  });

  it("合格・不合格の交互パターン", () => {
    // 1回目: 合格
    const pass = calculateScore(Array(10).fill({ isCorrect: true }));
    let result = calculatePromotionUpdate(0, pass.isPassed, "E1");
    expect(result.newConsecutivePasses).toBe(1);

    // 2回目: 不合格 → リセット
    const fail = calculateScore([
      ...Array(7).fill({ isCorrect: true }),
      ...Array(3).fill({ isCorrect: false }),
    ]);
    result = calculatePromotionUpdate(
      result.newConsecutivePasses,
      fail.isPassed,
      "E1",
    );
    expect(result.newConsecutivePasses).toBe(0);

    // 3回目〜5回目: 3回連続合格 → 昇格
    let consecutive = 0;
    for (let i = 0; i < 3; i++) {
      result = calculatePromotionUpdate(consecutive, pass.isPassed, "E1");
      consecutive = result.newConsecutivePasses;
    }
    expect(result.shouldPromote).toBe(true);
    expect(result.newGradeId).toBe("E2");
  });

  it("境界値: ちょうど80%で合格", () => {
    const answers = [
      ...Array(8).fill({ isCorrect: true }),
      ...Array(2).fill({ isCorrect: false }),
    ];
    const score = calculateScore(answers);
    expect(score.scorePercentage).toBe(80);
    expect(score.isPassed).toBe(true);
  });

  it("境界値: 79%で不合格 (切り捨て)", () => {
    // 100問中79問正解 → 79%
    const answers = [
      ...Array(79).fill({ isCorrect: true }),
      ...Array(21).fill({ isCorrect: false }),
    ];
    const score = calculateScore(answers);
    expect(score.scorePercentage).toBe(79);
    expect(score.isPassed).toBe(false);
  });

  it("0問正解でも正しく処理", () => {
    const answers = Array(10).fill({ isCorrect: false });
    const score = calculateScore(answers);
    expect(score.scorePercentage).toBe(0);
    expect(score.isPassed).toBe(false);

    const result = calculatePromotionUpdate(2, score.isPassed, "E5");
    expect(result.newConsecutivePasses).toBe(0);
  });
});

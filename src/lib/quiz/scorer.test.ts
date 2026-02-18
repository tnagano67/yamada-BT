import { describe, it, expect } from "vitest";
import { calculateScore } from "./scorer";

describe("calculateScore", () => {
  it("全問正解で100%・合格", () => {
    const answers = Array.from({ length: 10 }, () => ({ isCorrect: true }));
    const result = calculateScore(answers);

    expect(result.totalQuestions).toBe(10);
    expect(result.correctCount).toBe(10);
    expect(result.scorePercentage).toBe(100);
    expect(result.isPassed).toBe(true);
  });

  it("8問正解(80%)で合格", () => {
    const answers = [
      ...Array.from({ length: 8 }, () => ({ isCorrect: true })),
      ...Array.from({ length: 2 }, () => ({ isCorrect: false })),
    ];
    const result = calculateScore(answers);

    expect(result.correctCount).toBe(8);
    expect(result.scorePercentage).toBe(80);
    expect(result.isPassed).toBe(true);
  });

  it("7問正解(70%)で不合格", () => {
    const answers = [
      ...Array.from({ length: 7 }, () => ({ isCorrect: true })),
      ...Array.from({ length: 3 }, () => ({ isCorrect: false })),
    ];
    const result = calculateScore(answers);

    expect(result.correctCount).toBe(7);
    expect(result.scorePercentage).toBe(70);
    expect(result.isPassed).toBe(false);
  });

  it("全問不正解で0%・不合格", () => {
    const answers = Array.from({ length: 10 }, () => ({ isCorrect: false }));
    const result = calculateScore(answers);

    expect(result.correctCount).toBe(0);
    expect(result.scorePercentage).toBe(0);
    expect(result.isPassed).toBe(false);
  });

  it("未回答(null)は不正解として扱う", () => {
    const answers = [
      { isCorrect: true },
      { isCorrect: null },
      { isCorrect: null },
      { isCorrect: false },
    ];
    const result = calculateScore(answers);

    expect(result.totalQuestions).toBe(4);
    expect(result.correctCount).toBe(1);
    expect(result.scorePercentage).toBe(25);
    expect(result.isPassed).toBe(false);
  });

  it("空配列は0問・0%・不合格", () => {
    const result = calculateScore([]);

    expect(result.totalQuestions).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.scorePercentage).toBe(0);
    expect(result.isPassed).toBe(false);
  });

  it("パーセンテージは四捨五入", () => {
    // 1/3 = 33.33...% → 33%
    const answers = [
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: false },
    ];
    const result = calculateScore(answers);
    expect(result.scorePercentage).toBe(33);
  });
});

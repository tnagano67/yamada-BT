import { describe, it, expect } from "vitest";
import {
  parseGradeId,
  getNextGradeId,
  isMaxGrade,
  getInitialGradeId,
  calculatePromotionUpdate,
} from "./promotion";

describe("parseGradeId", () => {
  it("英語グレードをパースできる", () => {
    expect(parseGradeId("E5")).toEqual({
      prefix: "E",
      number: 5,
      subject: "english",
    });
  });

  it("日本語グレードをパースできる", () => {
    expect(parseGradeId("J20")).toEqual({
      prefix: "J",
      number: 20,
      subject: "japanese",
    });
  });

  it("不正なIDでエラーを投げる", () => {
    expect(() => parseGradeId("X5")).toThrow("不正なグレードID");
    expect(() => parseGradeId("")).toThrow("不正なグレードID");
    expect(() => parseGradeId("E")).toThrow("不正なグレードID");
    expect(() => parseGradeId("abc")).toThrow("不正なグレードID");
  });
});

describe("getNextGradeId", () => {
  it("E1 → E2", () => {
    expect(getNextGradeId("E1")).toBe("E2");
  });

  it("E47 → E48", () => {
    expect(getNextGradeId("E47")).toBe("E48");
  });

  it("E48 → null（最大）", () => {
    expect(getNextGradeId("E48")).toBeNull();
  });

  it("J1 → J2", () => {
    expect(getNextGradeId("J1")).toBe("J2");
  });

  it("J19 → J20", () => {
    expect(getNextGradeId("J19")).toBe("J20");
  });

  it("J20 → null（最大）", () => {
    expect(getNextGradeId("J20")).toBeNull();
  });
});

describe("isMaxGrade", () => {
  it("E48は最大グレード", () => {
    expect(isMaxGrade("E48")).toBe(true);
  });

  it("J20は最大グレード", () => {
    expect(isMaxGrade("J20")).toBe(true);
  });

  it("E1は最大グレードではない", () => {
    expect(isMaxGrade("E1")).toBe(false);
  });

  it("J10は最大グレードではない", () => {
    expect(isMaxGrade("J10")).toBe(false);
  });
});

describe("getInitialGradeId", () => {
  it("英語の初期グレードはE1", () => {
    expect(getInitialGradeId("english")).toBe("E1");
  });

  it("日本語の初期グレードはJ1", () => {
    expect(getInitialGradeId("japanese")).toBe("J1");
  });
});

describe("calculatePromotionUpdate", () => {
  it("不合格時: カウントを0にリセット", () => {
    const result = calculatePromotionUpdate(2, false, "E5");
    expect(result).toEqual({
      newConsecutivePasses: 0,
      shouldPromote: false,
      newGradeId: null,
    });
  });

  it("合格（1回目）: カウント+1", () => {
    const result = calculatePromotionUpdate(0, true, "E5");
    expect(result).toEqual({
      newConsecutivePasses: 1,
      shouldPromote: false,
      newGradeId: null,
    });
  });

  it("合格（2回目）: カウント+1", () => {
    const result = calculatePromotionUpdate(1, true, "E5");
    expect(result).toEqual({
      newConsecutivePasses: 2,
      shouldPromote: false,
      newGradeId: null,
    });
  });

  it("3回連続合格: 昇格してカウントリセット", () => {
    const result = calculatePromotionUpdate(2, true, "E5");
    expect(result).toEqual({
      newConsecutivePasses: 0,
      shouldPromote: true,
      newGradeId: "E6",
    });
  });

  it("最大グレード（E48）で3回連続合格: 昇格しない", () => {
    const result = calculatePromotionUpdate(2, true, "E48");
    expect(result).toEqual({
      newConsecutivePasses: 3,
      shouldPromote: false,
      newGradeId: null,
    });
  });

  it("最大グレード（J20）で3回連続合格: 昇格しない", () => {
    const result = calculatePromotionUpdate(2, true, "J20");
    expect(result).toEqual({
      newConsecutivePasses: 3,
      shouldPromote: false,
      newGradeId: null,
    });
  });

  it("不合格後の合格: カウント1から再開", () => {
    // 不合格でリセット後
    const afterFail = calculatePromotionUpdate(2, false, "E5");
    expect(afterFail.newConsecutivePasses).toBe(0);

    // 次の合格でカウント1
    const afterPass = calculatePromotionUpdate(
      afterFail.newConsecutivePasses,
      true,
      "E5",
    );
    expect(afterPass.newConsecutivePasses).toBe(1);
    expect(afterPass.shouldPromote).toBe(false);
  });
});

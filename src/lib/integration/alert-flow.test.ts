import { describe, it, expect } from "vitest";
import { detectAlerts } from "@/lib/alert/detector";
import type { AlertConditionInput } from "@/lib/alert/types";

function makeDate(daysAgo: number): Date {
  const d = new Date("2026-02-18T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

const baseInput: AlertConditionInput = {
  studentId: "student-1",
  studentName: "テスト太郎",
  recentMorningTestDates: [],
  recentDeliveryDates: [],
  weeklyAccuracies: [],
  goalProgressPercent: null,
  semesterProgressPercent: 0,
  previousStreak: null,
  currentStreak: 0,
  recentPromotionResults: [],
  lastSelfStudyDate: null,
  evaluationDate: new Date("2026-02-18T00:00:00.000Z"),
};

describe("アラート検知フローテスト", () => {
  describe("正常パターン - アラートなし", () => {
    it("毎日受験+高正答率+ストリーク維持でアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2), makeDate(3)],
        recentMorningTestDates: [makeDate(0), makeDate(1), makeDate(2), makeDate(3)],
        weeklyAccuracies: [90, 85, 80],
        previousStreak: null,
        currentStreak: 30,
        recentPromotionResults: [true, true, false],
        lastSelfStudyDate: makeDate(2),
      };

      const alerts = detectAlerts(input);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("要注意パターン - 全アラート発火", () => {
    it("6条件すべてに該当する最悪ケース", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        // 連続未受験: 5日
        recentDeliveryDates: [
          makeDate(0), makeDate(1), makeDate(2),
          makeDate(3), makeDate(4), makeDate(5),
        ],
        recentMorningTestDates: [makeDate(5)],
        // 正答率低下: 3週連続
        weeklyAccuracies: [40, 55, 70],
        // 目標達成危険: 学期後半+低進捗
        goalProgressPercent: 10,
        semesterProgressPercent: 70,
        // ストリーク途絶
        previousStreak: 15,
        currentStreak: 0,
        // 昇格停滞
        recentPromotionResults: [false, false, false, false],
        // 自学習なし
        lastSelfStudyDate: null,
      };

      const alerts = detectAlerts(input);
      const types = alerts.map((a) => a.alertType);

      expect(types).toContain("consecutive_absence");
      expect(types).toContain("accuracy_declining");
      expect(types).toContain("goal_at_risk");
      expect(types).toContain("streak_broken");
      expect(types).toContain("promotion_stuck");
      expect(types).toContain("no_self_study");
      expect(alerts).toHaveLength(6);
    });
  });

  describe("severity の正確性", () => {
    it("high severity アラートのみ検出", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2)],
        recentMorningTestDates: [], // 3日連続未受験 → high
        weeklyAccuracies: [50, 60, 70], // 3週連続低下 → high
        goalProgressPercent: 5, // 目標達成危険 → high
        semesterProgressPercent: 80,
        lastSelfStudyDate: makeDate(1), // 最近学習 → no_self_studyなし
        currentStreak: 5, // ストリーク継続中 → streak_brokenなし
        previousStreak: null,
        recentPromotionResults: [true], // 合格あり → promotion_stuckなし
      };

      const alerts = detectAlerts(input);
      const highAlerts = alerts.filter((a) => a.severity === "high");
      const nonHighAlerts = alerts.filter((a) => a.severity !== "high");

      expect(highAlerts.length).toBe(3);
      expect(nonHighAlerts.length).toBe(0);
    });

    it("medium severity アラートのみ検出", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0)],
        recentMorningTestDates: [makeDate(0)], // 受験済み → 連続未受験なし
        weeklyAccuracies: [80, 75, 80], // 低下なし
        previousStreak: 10, // 長期ストリークが途絶 → medium
        currentStreak: 0,
        recentPromotionResults: [false, false, false], // 3回連続不合格 → medium
        lastSelfStudyDate: makeDate(1), // 最近学習あり → no_self_studyなし
      };

      const alerts = detectAlerts(input);
      const mediumAlerts = alerts.filter((a) => a.severity === "medium");

      expect(mediumAlerts.length).toBe(2);
      expect(mediumAlerts.map((a) => a.alertType).sort()).toEqual([
        "promotion_stuck",
        "streak_broken",
      ]);
    });
  });

  describe("メッセージの内容確認", () => {
    it("連続未受験メッセージに日数が含まれる", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [
          makeDate(0), makeDate(1), makeDate(2),
          makeDate(3), makeDate(4),
        ],
        recentMorningTestDates: [makeDate(4)],
        lastSelfStudyDate: makeDate(1),
      };

      const alerts = detectAlerts(input);
      const absence = alerts.find(
        (a) => a.alertType === "consecutive_absence",
      );
      expect(absence).toBeDefined();
      expect(absence!.message).toContain("4日連続");
      expect(absence!.message).toContain("テスト太郎");
    });

    it("正答率低下メッセージに推移が含まれる", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        weeklyAccuracies: [50, 65, 80],
        lastSelfStudyDate: makeDate(1),
      };

      const alerts = detectAlerts(input);
      const declining = alerts.find(
        (a) => a.alertType === "accuracy_declining",
      );
      expect(declining).toBeDefined();
      expect(declining!.message).toContain("80% → 65% → 50%");
    });
  });

  describe("エッジケース", () => {
    it("空の入力でも安全に処理", () => {
      const alerts = detectAlerts(baseInput);
      // lastSelfStudyDate === null なので no_self_study のみ
      expect(alerts.length).toBe(1);
      expect(alerts[0].alertType).toBe("no_self_study");
    });

    it("studentId がレスポンスに含まれる", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        studentId: "abc-123",
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2)],
        recentMorningTestDates: [],
      };

      const alerts = detectAlerts(input);
      for (const alert of alerts) {
        expect(alert.studentId).toBe("abc-123");
      }
    });
  });
});

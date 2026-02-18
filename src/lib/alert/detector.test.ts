import { describe, it, expect } from "vitest";
import { detectAlerts } from "./detector";
import type { AlertConditionInput } from "./types";

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

describe("detectAlerts", () => {
  describe("consecutive_absence", () => {
    it("3日以上連続未受験でhighアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [
          makeDate(0), // 今日
          makeDate(1), // 昨日
          makeDate(2), // 一昨日
          makeDate(3),
        ],
        recentMorningTestDates: [makeDate(3)], // 3日前のみ受験
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "consecutive_absence");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
      expect(alert!.message).toContain("3日連続");
    });

    it("2日連続ではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2)],
        recentMorningTestDates: [makeDate(2)],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "consecutive_absence"),
      ).toBeUndefined();
    });

    it("全日受験済みならアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2)],
        recentMorningTestDates: [makeDate(0), makeDate(1), makeDate(2)],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "consecutive_absence"),
      ).toBeUndefined();
    });
  });

  describe("accuracy_declining", () => {
    it("3週連続低下でhighアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        weeklyAccuracies: [60, 70, 80], // 最新60%, 先週70%, 先々週80% → 低下
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "accuracy_declining");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("低下が2週のみではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        weeklyAccuracies: [60, 70],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "accuracy_declining"),
      ).toBeUndefined();
    });

    it("横ばいではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        weeklyAccuracies: [70, 70, 70],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "accuracy_declining"),
      ).toBeUndefined();
    });

    it("途中で上がっていればアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        weeklyAccuracies: [60, 80, 70],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "accuracy_declining"),
      ).toBeUndefined();
    });
  });

  describe("goal_at_risk", () => {
    it("学期中間過ぎ+達成率20%未満でhighアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        goalProgressPercent: 15,
        semesterProgressPercent: 60,
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "goal_at_risk");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("学期前半ではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        goalProgressPercent: 10,
        semesterProgressPercent: 30,
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "goal_at_risk"),
      ).toBeUndefined();
    });

    it("目標未設定ならアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        goalProgressPercent: null,
        semesterProgressPercent: 80,
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "goal_at_risk"),
      ).toBeUndefined();
    });

    it("達成率20%以上ならアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        goalProgressPercent: 25,
        semesterProgressPercent: 60,
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "goal_at_risk"),
      ).toBeUndefined();
    });
  });

  describe("streak_broken", () => {
    it("7日以上のストリーク途絶でmediumアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        previousStreak: 10,
        currentStreak: 0,
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "streak_broken");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
      expect(alert!.message).toContain("10日間");
    });

    it("6日以下のストリーク途絶ではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        previousStreak: 6,
        currentStreak: 0,
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "streak_broken"),
      ).toBeUndefined();
    });

    it("ストリーク継続中ならアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        previousStreak: 10,
        currentStreak: 5,
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "streak_broken"),
      ).toBeUndefined();
    });
  });

  describe("promotion_stuck", () => {
    it("3回連続不合格でmediumアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentPromotionResults: [false, false, false],
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "promotion_stuck");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
    });

    it("途中に合格があればアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentPromotionResults: [false, true, false],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "promotion_stuck"),
      ).toBeUndefined();
    });

    it("2回不合格ではアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentPromotionResults: [false, false],
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "promotion_stuck"),
      ).toBeUndefined();
    });
  });

  describe("no_self_study", () => {
    it("自学自習記録なしでlowアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        lastSelfStudyDate: null,
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "no_self_study");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("low");
    });

    it("7日以上前の最終自学自習でlowアラート", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        lastSelfStudyDate: makeDate(10),
      };

      const alerts = detectAlerts(input);
      const alert = alerts.find((a) => a.alertType === "no_self_study");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("10日間");
    });

    it("6日前の自学自習ならアラートなし", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        lastSelfStudyDate: makeDate(6),
      };

      const alerts = detectAlerts(input);
      expect(
        alerts.find((a) => a.alertType === "no_self_study"),
      ).toBeUndefined();
    });
  });

  describe("複数アラートの同時検出", () => {
    it("複数条件に該当する場合はすべて返す", () => {
      const input: AlertConditionInput = {
        ...baseInput,
        recentDeliveryDates: [makeDate(0), makeDate(1), makeDate(2)],
        recentMorningTestDates: [],
        previousStreak: 15,
        currentStreak: 0,
        lastSelfStudyDate: null,
      };

      const alerts = detectAlerts(input);
      expect(alerts.length).toBeGreaterThanOrEqual(3);
      expect(alerts.map((a) => a.alertType)).toContain("consecutive_absence");
      expect(alerts.map((a) => a.alertType)).toContain("streak_broken");
      expect(alerts.map((a) => a.alertType)).toContain("no_self_study");
    });
  });
});

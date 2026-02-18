import { describe, it, expect } from "vitest";
import {
  calculateFlameLevel,
  shouldSkipDay,
  isVacationDay,
  calculateStreakUpdate,
} from "./streak-calculator";
import type { CalendarDayInfo } from "./streak-calculator";
import type { DayType } from "@/generated/prisma/client";

// Helper to create a school_day CalendarDayInfo
function schoolDay(overrides?: Partial<CalendarDayInfo>): CalendarDayInfo {
  return {
    dayType: "school_day",
    hasMorningTest: true,
    streakRequired: true,
    ...overrides,
  };
}

function dayOfType(dayType: DayType): CalendarDayInfo {
  return {
    dayType,
    hasMorningTest: false,
    streakRequired: dayType === "school_day",
  };
}

describe("calculateFlameLevel", () => {
  it.each([
    [0, 0],
    [1, 1],
    [6, 1],
    [7, 2],
    [29, 2],
    [30, 3],
    [59, 3],
    [60, 4],
    [99, 4],
    [100, 5],
    [200, 5],
  ])("streakDays=%i → level=%i", (days, expectedLevel) => {
    expect(calculateFlameLevel(days)).toBe(expectedLevel);
  });
});

describe("shouldSkipDay", () => {
  it.each<[DayType, boolean]>([
    ["school_day", false],
    ["weekend", true],
    ["holiday", true],
    ["exam_period", true],
    ["vacation", false],
    ["special", false],
  ])("dayType=%s → %s", (dayType, expected) => {
    expect(shouldSkipDay(dayType)).toBe(expected);
  });
});

describe("isVacationDay", () => {
  it("vacation → true", () => {
    expect(isVacationDay("vacation")).toBe(true);
  });

  it.each<DayType>(["school_day", "weekend", "holiday", "exam_period", "special"])(
    "%s → false",
    (dayType) => {
      expect(isVacationDay(dayType)).toBe(false);
    },
  );
});

describe("calculateStreakUpdate", () => {
  it("attended: school_day + taken → streak+1", () => {
    const result = calculateStreakUpdate({
      currentStreak: 5,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: true,
      isExcused: false,
    });

    expect(result.status).toBe("attended");
    expect(result.newStreak).toBe(6);
    expect(result.newFlameLevel).toBe(1);
    expect(result.freezeConsumed).toBe(false);
    expect(result.freezeBonusAwarded).toBe(false);
  });

  it("attended_milestone: streak reaches 30 → freezeBonus awarded", () => {
    const result = calculateStreakUpdate({
      currentStreak: 29,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: true,
      isExcused: false,
    });

    expect(result.status).toBe("attended");
    expect(result.newStreak).toBe(30);
    expect(result.newFlameLevel).toBe(3);
    expect(result.freezeBonusAwarded).toBe(true);
    expect(result.freezeRemaining).toBe(4);
  });

  it("freeze_used: school_day + not taken + freeze available → freeze consumed", () => {
    const result = calculateStreakUpdate({
      currentStreak: 10,
      freezeRemaining: 2,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("freeze_used");
    expect(result.newStreak).toBe(10);
    expect(result.freezeConsumed).toBe(true);
    expect(result.freezeRemaining).toBe(1);
  });

  it("missed: school_day + not taken + no freeze → streak reset to 0", () => {
    const result = calculateStreakUpdate({
      currentStreak: 15,
      freezeRemaining: 0,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("missed");
    expect(result.newStreak).toBe(0);
    expect(result.newFlameLevel).toBe(0);
    expect(result.freezeConsumed).toBe(false);
  });

  it("excused: school_day + not taken + excused → no change", () => {
    const result = calculateStreakUpdate({
      currentStreak: 10,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: false,
      isExcused: true,
    });

    expect(result.status).toBe("excused");
    expect(result.newStreak).toBe(10);
    expect(result.freezeConsumed).toBe(false);
    expect(result.freezeRemaining).toBe(3);
  });

  it("skipped_weekend: weekend → skipped, no change", () => {
    const result = calculateStreakUpdate({
      currentStreak: 10,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: dayOfType("weekend"),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("skipped");
    expect(result.newStreak).toBe(10);
    expect(result.freezeConsumed).toBe(false);
  });

  it("skipped_holiday: holiday → skipped, no change", () => {
    const result = calculateStreakUpdate({
      currentStreak: 10,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: dayOfType("holiday"),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("skipped");
    expect(result.newStreak).toBe(10);
  });

  it("skipped_exam: exam_period → skipped, no change", () => {
    const result = calculateStreakUpdate({
      currentStreak: 10,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: dayOfType("exam_period"),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("skipped");
    expect(result.newStreak).toBe(10);
  });

  it("vacation: vacation → streak frozen", () => {
    const result = calculateStreakUpdate({
      currentStreak: 20,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: dayOfType("vacation"),
      hasTakenMorningTest: false,
      isExcused: false,
    });

    expect(result.status).toBe("vacation");
    expect(result.newStreak).toBe(20);
    expect(result.vacationFrozenStreak).toBe(20);
    expect(result.freezeConsumed).toBe(false);
  });

  it("vacation_return: school_day after vacation → restore streak", () => {
    const result = calculateStreakUpdate({
      currentStreak: 0,
      freezeRemaining: 3,
      vacationFrozenStreak: 20,
      calendarDay: schoolDay(),
      hasTakenMorningTest: true,
      isExcused: false,
    });

    expect(result.status).toBe("attended");
    expect(result.newStreak).toBe(21);
    expect(result.vacationFrozenStreak).toBeNull();
  });

  it("freeze_max_cap: milestone bonus should not exceed FREEZE_MAX", () => {
    const result = calculateStreakUpdate({
      currentStreak: 29,
      freezeRemaining: 5,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: true,
      isExcused: false,
    });

    expect(result.status).toBe("attended");
    expect(result.newStreak).toBe(30);
    expect(result.freezeBonusAwarded).toBe(false);
    expect(result.freezeRemaining).toBe(5);
  });

  it("flame_level_update: streak going from 6→7 should change flame from 1→2", () => {
    expect(calculateFlameLevel(6)).toBe(1);

    const result = calculateStreakUpdate({
      currentStreak: 6,
      freezeRemaining: 3,
      vacationFrozenStreak: null,
      calendarDay: schoolDay(),
      hasTakenMorningTest: true,
      isExcused: false,
    });

    expect(result.status).toBe("attended");
    expect(result.newStreak).toBe(7);
    expect(result.newFlameLevel).toBe(2);
  });
});

import type { DayType, StreakDayStatus } from "@/generated/prisma/client";
import {
  FLAME_LEVEL_THRESHOLDS,
  AUTO_SKIP_DAY_TYPES,
  VACATION_DAY_TYPES,
  FREEZE_BONUS_MILESTONE,
  FREEZE_MAX,
} from "./constants";

export interface CalendarDayInfo {
  dayType: DayType;
  hasMorningTest: boolean;
  streakRequired: boolean;
}

export interface StreakUpdateResult {
  status: StreakDayStatus;
  newStreak: number;
  newFlameLevel: number;
  freezeConsumed: boolean;
  freezeRemaining: number;
  vacationFrozenStreak: number | null;
  freezeBonusAwarded: boolean;
}

export function calculateFlameLevel(streakDays: number): number {
  for (const { level, minDays } of FLAME_LEVEL_THRESHOLDS) {
    if (streakDays >= minDays) {
      return level;
    }
  }
  return 0;
}

export function shouldSkipDay(dayType: DayType): boolean {
  return AUTO_SKIP_DAY_TYPES.includes(dayType);
}

export function isVacationDay(dayType: DayType): boolean {
  return VACATION_DAY_TYPES.includes(dayType);
}

interface CalculateStreakUpdateParams {
  currentStreak: number;
  freezeRemaining: number;
  vacationFrozenStreak: number | null;
  calendarDay: CalendarDayInfo;
  hasTakenMorningTest: boolean;
  isExcused: boolean;
}

export function calculateStreakUpdate(
  params: CalculateStreakUpdateParams,
): StreakUpdateResult {
  const {
    currentStreak,
    freezeRemaining,
    vacationFrozenStreak,
    calendarDay,
    hasTakenMorningTest,
    isExcused,
  } = params;

  // 1. Vacation day → freeze the streak
  if (isVacationDay(calendarDay.dayType)) {
    return {
      status: "vacation",
      newStreak: currentStreak,
      newFlameLevel: calculateFlameLevel(currentStreak),
      freezeConsumed: false,
      freezeRemaining,
      vacationFrozenStreak: vacationFrozenStreak ?? currentStreak,
      freezeBonusAwarded: false,
    };
  }

  // Restore streak from vacation if returning
  const activeStreak = vacationFrozenStreak ?? currentStreak;

  // 2. Weekend/holiday/exam_period → skip
  if (shouldSkipDay(calendarDay.dayType)) {
    return {
      status: "skipped",
      newStreak: activeStreak,
      newFlameLevel: calculateFlameLevel(activeStreak),
      freezeConsumed: false,
      freezeRemaining,
      vacationFrozenStreak: null,
      freezeBonusAwarded: false,
    };
  }

  // 3. School day + has taken morning test → attended
  if (hasTakenMorningTest) {
    const newStreak = activeStreak + 1;
    const newFlameLevel = calculateFlameLevel(newStreak);
    const freezeBonusAwarded =
      newStreak % FREEZE_BONUS_MILESTONE === 0 &&
      newStreak > 0 &&
      freezeRemaining < FREEZE_MAX;

    return {
      status: "attended",
      newStreak,
      newFlameLevel,
      freezeConsumed: false,
      freezeRemaining: freezeBonusAwarded
        ? freezeRemaining + 1
        : freezeRemaining,
      vacationFrozenStreak: null,
      freezeBonusAwarded,
    };
  }

  // 4. School day + excused → no change
  if (isExcused) {
    return {
      status: "excused",
      newStreak: activeStreak,
      newFlameLevel: calculateFlameLevel(activeStreak),
      freezeConsumed: false,
      freezeRemaining,
      vacationFrozenStreak: null,
      freezeBonusAwarded: false,
    };
  }

  // 5. School day + not taken + freeze available → use freeze
  if (freezeRemaining > 0) {
    return {
      status: "freeze_used",
      newStreak: activeStreak,
      newFlameLevel: calculateFlameLevel(activeStreak),
      freezeConsumed: true,
      freezeRemaining: freezeRemaining - 1,
      vacationFrozenStreak: null,
      freezeBonusAwarded: false,
    };
  }

  // 6. School day + not taken + no freeze → missed
  return {
    status: "missed",
    newStreak: 0,
    newFlameLevel: 0,
    freezeConsumed: false,
    freezeRemaining,
    vacationFrozenStreak: null,
    freezeBonusAwarded: false,
  };
}

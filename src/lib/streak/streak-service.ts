import { prisma } from "@/lib/db/prisma";
import { todayJST, getDayOfWeek } from "@/lib/date-utils";
import { calculateStreakUpdate } from "./streak-calculator";
import type { CalendarDayInfo } from "./streak-calculator";
import { getCalendarDayInfo } from "@/lib/calendar/calendar-service";
import { FREEZE_INITIAL, REVIVAL_INITIAL } from "./constants";

export interface StreakDisplayData {
  currentStreak: number;
  maxStreak: number;
  flameLevel: number;
  freezeRemaining: number;
  revivalRemaining: number;
  lastActivityDate: Date | null;
  streakStartDate: Date | null;
}

/**
 * 生徒のストリークレコードを初期化・取得する
 */
export async function ensureStudentStreak(studentId: string) {
  return prisma.studentStreak.upsert({
    where: { studentId },
    create: {
      studentId,
      currentStreak: 0,
      maxStreak: 0,
      freezeRemaining: FREEZE_INITIAL,
      revivalRemaining: REVIVAL_INITIAL,
      flameLevel: 0,
    },
    update: {},
  });
}

/**
 * カレンダー未設定時のデフォルトDayInfo を返す
 */
function getDefaultCalendarDayInfo(date: Date): CalendarDayInfo {
  const dayOfWeek = getDayOfWeek(date);
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { dayType: "weekend", hasMorningTest: false, streakRequired: false };
  }
  return { dayType: "school_day", hasMorningTest: true, streakRequired: true };
}

/**
 * 朝テスト受験時にストリークを即時更新する
 */
export async function recordMorningTestAttendance(
  studentId: string,
): Promise<void> {
  const today = todayJST();

  // カレンダー情報取得（未設定時は平日デフォルト）
  const calendarDay =
    (await getCalendarDayInfo(today)) ?? getDefaultCalendarDayInfo(today);

  // ストリーク対象でなければスキップ
  if (calendarDay.dayType !== "school_day") return;

  const streak = await ensureStudentStreak(studentId);

  // 既に本日のログがある場合はスキップ
  const existingLog = await prisma.streakDailyLog.findUnique({
    where: { studentId_date: { studentId, date: today } },
  });
  if (existingLog) return;

  const result = calculateStreakUpdate({
    currentStreak: streak.currentStreak,
    freezeRemaining: streak.freezeRemaining,
    vacationFrozenStreak: streak.vacationFrozenStreak,
    calendarDay,
    hasTakenMorningTest: true,
    isExcused: false,
  });

  await prisma.$transaction([
    prisma.streakDailyLog.create({
      data: {
        studentId,
        date: today,
        status: result.status,
        streakCountAfter: result.newStreak,
      },
    }),
    prisma.studentStreak.update({
      where: { studentId },
      data: {
        currentStreak: result.newStreak,
        maxStreak: Math.max(streak.maxStreak, result.newStreak),
        flameLevel: result.newFlameLevel,
        freezeRemaining: result.freezeRemaining,
        lastActivityDate: today,
        streakStartDate:
          streak.currentStreak === 0 ? today : streak.streakStartDate,
        vacationFrozenStreak: result.vacationFrozenStreak,
      },
    }),
  ]);
}

/**
 * ストリーク表示用データを取得する
 */
export async function getStreakDisplayData(
  studentId: string,
): Promise<StreakDisplayData | null> {
  const streak = await prisma.studentStreak.findUnique({
    where: { studentId },
  });
  if (!streak) return null;

  return {
    currentStreak: streak.currentStreak,
    maxStreak: streak.maxStreak,
    flameLevel: streak.flameLevel,
    freezeRemaining: streak.freezeRemaining,
    revivalRemaining: streak.revivalRemaining,
    lastActivityDate: streak.lastActivityDate,
    streakStartDate: streak.streakStartDate,
  };
}

/**
 * 夜間バッチ: 指定日の全生徒のストリークを評価する
 */
export async function processDailyStreaksForDate(
  targetDate: Date,
): Promise<{
  processed: number;
  attended: number;
  frozen: number;
  missed: number;
}> {
  // targetDate は UTC midnight の Date を期待（todayJST() の形式）
  const date = new Date(
    Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()),
  );

  // カレンダー情報取得
  const calendarDay =
    (await getCalendarDayInfo(date)) ?? getDefaultCalendarDayInfo(date);

  // school_day以外はスキップ（バッチ処理不要）
  if (calendarDay.dayType !== "school_day") {
    return { processed: 0, attended: 0, frozen: 0, missed: 0 };
  }

  // アクティブな生徒を全員取得
  const students = await prisma.user.findMany({
    where: { role: "student", isActive: true },
    select: { id: true },
  });

  let attended = 0;
  let frozen = 0;
  let missed = 0;

  for (const student of students) {
    try {
      // 既にattendedログがある場合はスキップ（即時更新済み）
      const existingLog = await prisma.streakDailyLog.findUnique({
        where: { studentId_date: { studentId: student.id, date } },
      });
      if (existingLog) {
        if (existingLog.status === "attended") attended++;
        continue;
      }

      const streak = await ensureStudentStreak(student.id);

      const result = calculateStreakUpdate({
        currentStreak: streak.currentStreak,
        freezeRemaining: streak.freezeRemaining,
        vacationFrozenStreak: streak.vacationFrozenStreak,
        calendarDay,
        hasTakenMorningTest: false,
        isExcused: false,
      });

      await prisma.$transaction([
        prisma.streakDailyLog.create({
          data: {
            studentId: student.id,
            date,
            status: result.status,
            streakCountAfter: result.newStreak,
          },
        }),
        prisma.studentStreak.update({
          where: { studentId: student.id },
          data: {
            currentStreak: result.newStreak,
            maxStreak: Math.max(streak.maxStreak, result.newStreak),
            flameLevel: result.newFlameLevel,
            freezeRemaining: result.freezeRemaining,
            vacationFrozenStreak: result.vacationFrozenStreak,
          },
        }),
      ]);

      if (result.status === "freeze_used") frozen++;
      if (result.status === "missed") missed++;
    } catch (error) {
      console.error(
        `Failed to process streak for student ${student.id}:`,
        error,
      );
    }
  }

  return {
    processed: students.length,
    attended,
    frozen,
    missed,
  };
}

import { prisma } from "@/lib/db/prisma";
import { todayJST } from "@/lib/date-utils";
import type {
  DayType,
  SchoolCalendar,
  Semester,
} from "@/generated/prisma/client";

export interface CalendarDayInfo {
  dayType: DayType;
  hasMorningTest: boolean;
  streakRequired: boolean;
}

/**
 * 指定月の学校カレンダーを取得する
 */
export async function getSchoolCalendarMonth(
  year: number,
  month: number,
): Promise<SchoolCalendar[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // last day of month

  return prisma.schoolCalendar.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * カレンダー日をupsertする
 */
export async function upsertCalendarDay(
  date: Date,
  dayType: DayType,
  hasMorningTest: boolean,
  note?: string,
): Promise<SchoolCalendar> {
  const streakRequired = dayType === "school_day" && hasMorningTest;

  return prisma.schoolCalendar.upsert({
    where: { date },
    create: {
      date,
      dayType,
      hasMorningTest,
      streakRequired,
      note: note ?? null,
    },
    update: {
      dayType,
      hasMorningTest,
      streakRequired,
      note: note ?? null,
    },
  });
}

/**
 * CSVからカレンダーを一括インポートする
 */
export async function importCalendarFromCsv(
  rows: {
    date: string;
    dayType: DayType;
    hasMorningTest: boolean;
    note: string;
  }[],
): Promise<{ imported: number; errors: { line: number; message: string }[] }> {
  const errors: { line: number; message: string }[] = [];

  const results = await prisma.$transaction(
    rows.map((row) => {
      const date = new Date(row.date + "T00:00:00.000Z");
      const streakRequired =
        row.dayType === "school_day" && row.hasMorningTest;

      return prisma.schoolCalendar.upsert({
        where: { date },
        create: {
          date,
          dayType: row.dayType,
          hasMorningTest: row.hasMorningTest,
          streakRequired,
          note: row.note || null,
        },
        update: {
          dayType: row.dayType,
          hasMorningTest: row.hasMorningTest,
          streakRequired,
          note: row.note || null,
        },
      });
    }),
  );

  return { imported: results.length, errors };
}

/**
 * 指定日のカレンダー情報を取得する
 */
export async function getCalendarDayInfo(
  date: Date,
): Promise<CalendarDayInfo | null> {
  const entry = await prisma.schoolCalendar.findUnique({
    where: { date },
  });

  if (!entry) return null;

  return {
    dayType: entry.dayType,
    hasMorningTest: entry.hasMorningTest,
    streakRequired: entry.streakRequired,
  };
}

/**
 * 指定年度の学期一覧を取得する
 */
export async function getSemesters(
  academicYear: number,
): Promise<Semester[]> {
  return prisma.semester.findMany({
    where: { academicYear },
    orderBy: { term: "asc" },
  });
}

/**
 * 学期をupsertする
 */
export async function upsertSemester(
  academicYear: number,
  term: number,
  startDate: Date,
  endDate: Date,
): Promise<Semester> {
  return prisma.semester.upsert({
    where: {
      academicYear_term: { academicYear, term },
    },
    create: {
      academicYear,
      term,
      startDate,
      endDate,
    },
    update: {
      startDate,
      endDate,
    },
  });
}

/**
 * 現在の学期を取得する
 */
export async function getCurrentSemester(): Promise<Semester | null> {
  const today = todayJST();

  return prisma.semester.findFirst({
    where: {
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
}

/**
 * 指定年の学校カレンダーを全月分取得する（年間概要用）
 */
export async function getSchoolCalendarYear(
  year: number,
): Promise<SchoolCalendar[]> {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  return prisma.schoolCalendar.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * 指定年の土日エントリーを一括生成する
 */
export async function generateWeekendEntries(year: number): Promise<number> {
  const operations = [];
  const date = new Date(Date.UTC(year, 0, 1));

  while (date.getUTCFullYear() === year) {
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const d = new Date(date);
      operations.push(
        prisma.schoolCalendar.upsert({
          where: { date: d },
          create: {
            date: d,
            dayType: "weekend",
            hasMorningTest: false,
            streakRequired: false,
          },
          update: {
            dayType: "weekend",
            hasMorningTest: false,
            streakRequired: false,
          },
        }),
      );
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }

  const results = await prisma.$transaction(operations);
  return results.length;
}

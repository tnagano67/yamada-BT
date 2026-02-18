import { prisma } from "@/lib/db/prisma";
import type { Subject } from "@/generated/prisma/client";
import type { SchedulePattern, SuspensionInput, CalendarDay } from "./types";
import { DEFAULT_DELIVERY_TIME, DEFAULT_DEADLINE_MINUTES } from "./constants";

/**
 * スケジュールパターンを取得する
 */
export async function getSchedulePatterns(
  academicYear: number,
  semester: number,
  subject: Subject,
): Promise<SchedulePattern[]> {
  const schedules = await prisma.quizSchedule.findMany({
    where: { academicYear, semester, subject },
    orderBy: { dayOfWeek: "asc" },
  });

  // 0-6の全曜日分を返す（未設定は非アクティブとして返す）
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isActive: existing?.isActive ?? false,
      deliveryTime: existing?.deliveryTime ?? DEFAULT_DELIVERY_TIME,
      deadlineMinutes: existing?.deadlineMinutes ?? DEFAULT_DEADLINE_MINUTES,
    };
  });
}

/**
 * スケジュールパターンを更新する
 */
export async function updateSchedulePatterns(
  academicYear: number,
  semester: number,
  subject: Subject,
  patterns: SchedulePattern[],
): Promise<void> {
  await prisma.$transaction(
    patterns.map((pattern) =>
      prisma.quizSchedule.upsert({
        where: {
          academicYear_semester_dayOfWeek_subject: {
            academicYear,
            semester,
            dayOfWeek: pattern.dayOfWeek,
            subject,
          },
        },
        create: {
          academicYear,
          semester,
          dayOfWeek: pattern.dayOfWeek,
          subject,
          deliveryTime: pattern.deliveryTime,
          deadlineMinutes: pattern.deadlineMinutes,
          isActive: pattern.isActive,
        },
        update: {
          deliveryTime: pattern.deliveryTime,
          deadlineMinutes: pattern.deadlineMinutes,
          isActive: pattern.isActive,
        },
      }),
    ),
  );
}

/**
 * 休止期間を作成する
 */
export async function createSuspension(
  input: SuspensionInput,
): Promise<{ id: string }> {
  const suspension = await prisma.scheduleSuspension.create({
    data: {
      academicYear: input.academicYear,
      semester: input.semester,
      subject: input.subject,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    },
    select: { id: true },
  });
  return suspension;
}

/**
 * 休止期間を削除する
 */
export async function deleteSuspension(id: string): Promise<void> {
  await prisma.scheduleSuspension.delete({ where: { id } });
}

/**
 * 休止期間一覧を取得する
 */
export async function getSuspensions(
  academicYear: number,
  semester: number,
  subject: Subject,
) {
  return prisma.scheduleSuspension.findMany({
    where: { academicYear, semester, subject },
    orderBy: { startDate: "asc" },
  });
}

/**
 * 指定日が休止期間に含まれるか判定する
 */
export async function isDateSuspended(
  date: Date,
  subject: Subject,
): Promise<boolean> {
  const count = await prisma.scheduleSuspension.count({
    where: {
      subject,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
  return count > 0;
}

/**
 * 月間カレンダーデータを取得する
 */
export async function getCalendarMonth(
  year: number,
  month: number,
  subject: Subject,
): Promise<CalendarDay[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // last day of month

  // 配信データと休止期間を並列取得
  const [deliveries, suspensions] = await Promise.all([
    prisma.quizDelivery.findMany({
      where: {
        subject,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.scheduleSuspension.findMany({
      where: {
        subject,
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    }),
  ]);

  const days: CalendarDay[] = [];
  const daysInMonth = endDate.getUTCDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const delivery = deliveries.find((del) => {
      const delDate = new Date(del.date);
      return delDate.getUTCDate() === d && delDate.getUTCMonth() === month - 1;
    });

    const isSuspended = suspensions.some((s) => {
      return date >= s.startDate && date <= s.endDate;
    });

    if (delivery) {
      days.push({
        date,
        deliveryStatus: delivery.status,
        subject: delivery.subject,
      });
    } else if (isSuspended) {
      days.push({ date, deliveryStatus: "suspended", subject });
    } else {
      days.push({ date, deliveryStatus: null, subject: null });
    }
  }

  return days;
}

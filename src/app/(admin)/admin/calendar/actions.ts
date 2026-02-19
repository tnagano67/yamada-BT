"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { DayType } from "@/generated/prisma/client";
import {
  upsertCalendarDay,
  importCalendarFromCsv,
  upsertSemester,
  generateWeekendEntries,
} from "@/lib/calendar/calendar-service";
import { parseCalendarCsv } from "@/lib/calendar/csv-parser";

/**
 * カレンダー日を更新する
 */
export async function updateCalendarDayAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, error: "権限がありません" };
  }

  try {
    const dateStr = formData.get("date") as string;
    const dayType = formData.get("dayType") as DayType;
    const hasMorningTest = formData.get("hasMorningTest") === "true";
    const note = (formData.get("note") as string) || undefined;

    const date = new Date(dateStr + "T00:00:00.000Z");
    await upsertCalendarDay(date, dayType, hasMorningTest, note);

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch {
    return { success: false, error: "保存に失敗しました" };
  }
}

/**
 * CSVからカレンダーをインポートする
 */
export async function importCalendarCsvAction(
  formData: FormData,
): Promise<{
  success: boolean;
  imported?: number;
  errors?: { line: number; message: string }[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, error: "権限がありません" };
  }

  try {
    const csvText = formData.get("csvText") as string;
    if (!csvText) {
      return { success: false, error: "CSVデータが空です" };
    }

    const parsed = parseCalendarCsv(csvText);
    if (parsed.rows.length === 0) {
      return {
        success: false,
        errors: parsed.errors,
        error: "インポート可能な行がありません",
      };
    }

    const result = await importCalendarFromCsv(parsed.rows);

    revalidatePath("/admin/calendar");
    return {
      success: true,
      imported: result.imported,
      errors: [...parsed.errors, ...result.errors],
    };
  } catch {
    return { success: false, error: "インポートに失敗しました" };
  }
}

/**
 * 学期を更新する
 */
export async function updateSemesterAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, error: "権限がありません" };
  }

  try {
    const academicYear = Number(formData.get("academicYear"));
    const term = Number(formData.get("term"));
    const startDate = new Date(
      (formData.get("startDate") as string) + "T00:00:00.000Z",
    );
    const endDate = new Date(
      (formData.get("endDate") as string) + "T00:00:00.000Z",
    );

    await upsertSemester(academicYear, term, startDate, endDate);

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch {
    return { success: false, error: "保存に失敗しました" };
  }
}

/**
 * 土日エントリーを一括生成する
 */
export async function generateWeekendsAction(
  formData: FormData,
): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, error: "権限がありません" };
  }

  try {
    const year = Number(formData.get("year"));
    const count = await generateWeekendEntries(year);

    revalidatePath("/admin/calendar");
    return { success: true, count };
  } catch {
    return { success: false, error: "生成に失敗しました" };
  }
}

/**
 * 授業日に朝テストを一括設定する
 */
export async function bulkSetMorningTestAction(
  formData: FormData,
): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, error: "権限がありません" };
  }

  try {
    const year = Number(formData.get("year"));
    const month = formData.get("month")
      ? Number(formData.get("month"))
      : undefined;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0));
    } else {
      startDate = new Date(Date.UTC(year, 0, 1));
      endDate = new Date(Date.UTC(year, 11, 31));
    }

    const result = await prisma.schoolCalendar.updateMany({
      where: {
        date: { gte: startDate, lte: endDate },
        dayType: "school_day",
        hasMorningTest: false,
      },
      data: {
        hasMorningTest: true,
        streakRequired: true,
      },
    });

    revalidatePath("/admin/calendar");
    return { success: true, count: result.count };
  } catch {
    return { success: false, error: "設定に失敗しました" };
  }
}

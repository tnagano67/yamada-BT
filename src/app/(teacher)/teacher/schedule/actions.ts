"use server";

import { auth } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/roles";
import type { Subject } from "@/generated/prisma/client";
import {
  updateSchedulePatterns,
  createSuspension,
  deleteSuspension,
} from "@/lib/schedule/schedule-service";
import type { SchedulePattern } from "@/lib/schedule/types";
import { revalidatePath } from "next/cache";

/**
 * スケジュールパターンを更新する
 */
export async function updateSchedulePatternAction(
  academicYear: number,
  semester: number,
  subject: Subject,
  patterns: SchedulePattern[],
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "subject_lead")) {
    return { success: false, error: "権限がありません" };
  }

  try {
    await updateSchedulePatterns(academicYear, semester, subject, patterns);
    revalidatePath("/teacher/schedule");
    return { success: true };
  } catch {
    return { success: false, error: "保存に失敗しました" };
  }
}

/**
 * 休止期間を追加する
 */
export async function addSuspensionAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "subject_lead")) {
    throw new Error("権限がありません");
  }

  const academicYear = Number(formData.get("academicYear"));
  const semester = Number(formData.get("semester"));
  const subject = formData.get("subject") as Subject;
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const reason = (formData.get("reason") as string) || undefined;

  await createSuspension({
    academicYear,
    semester,
    subject,
    startDate,
    endDate,
    reason,
  });

  revalidatePath("/teacher/schedule");
}

/**
 * 休止期間を削除する
 */
export async function removeSuspensionAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "subject_lead")) {
    throw new Error("権限がありません");
  }

  const id = formData.get("id") as string;
  await deleteSuspension(id);

  revalidatePath("/teacher/schedule");
}

"use server";

import { auth } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/roles";
import type { UserRole } from "@/generated/prisma/client";
import {
  acknowledgeAlert as acknowledgeAlertService,
  generateAlertsForTeacher,
} from "@/lib/alert/alert-service";
import { revalidatePath } from "next/cache";

export async function acknowledgeAlertAction(alertId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role as UserRole, "teacher")) {
    throw new Error("権限がありません");
  }

  await acknowledgeAlertService(alertId, session.user.id);
  revalidatePath("/teacher/alerts");
  revalidatePath("/teacher/dashboard");
}

export async function refreshAlertsAction(): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role as UserRole, "teacher")) {
    throw new Error("権限がありません");
  }

  await generateAlertsForTeacher(session.user.id);
  revalidatePath("/teacher/alerts");
  revalidatePath("/teacher/dashboard");
}

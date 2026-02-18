"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import {
  updateTeacherRole,
  toggleTeacherActive,
  assignTeacherToClass,
  removeTeacherAssignment,
  getTeacherAssignments,
} from "@/lib/admin/teacher-service";
import type {
  UserRole,
  TeacherAssignmentRole,
  Subject,
} from "@/generated/prisma/client";

export async function updateTeacherRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as UserRole;

  await updateTeacherRole(userId, role);
  revalidatePath("/admin/teachers");
}

export async function toggleTeacherActiveAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;
  const isActive = formData.get("isActive") === "true";

  await toggleTeacherActive(userId, isActive);
  revalidatePath("/admin/teachers");
}

export async function assignTeacherAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const teacherId = formData.get("teacherId") as string;
  const classId = formData.get("classId") as string;
  const role = formData.get("role") as TeacherAssignmentRole;
  const subject = (formData.get("subject") as Subject) || undefined;

  await assignTeacherToClass(teacherId, classId, role, subject);
  revalidatePath("/admin/teachers");
}

export async function removeAssignmentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const assignmentId = formData.get("assignmentId") as string;

  await removeTeacherAssignment(assignmentId);
  revalidatePath("/admin/teachers");
}

export async function getTeacherAssignmentsAction(teacherId: string) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  return getTeacherAssignments(teacherId);
}

"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  updateTeacherRole,
  toggleTeacherActive,
  assignTeacherToClass,
  removeTeacherAssignment,
  getTeacherAssignments,
  importTeachersFromCsv,
} from "@/lib/admin/teacher-service";
import { parseTeacherCsv } from "@/lib/admin/csv-parser";
import type {
  UserRole,
  TeacherAssignmentRole,
  Subject,
} from "@/generated/prisma/client";

export async function createTeacherAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;
  const role = formData.get("role") as UserRole;

  await createTeacher({ name, nameKana, email, role });
  revalidatePath("/admin/teachers");
}

export async function updateTeacherAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;

  await updateTeacher(userId, { name, nameKana, email });
  revalidatePath("/admin/teachers");
}

export async function deleteTeacherAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;

  await deleteTeacher(userId);
  revalidatePath("/admin/teachers");
}

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

export async function importTeachersAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const csvText = formData.get("csvText") as string;
  const parsed = parseTeacherCsv(csvText);

  if (parsed.rows.length === 0) {
    return { imported: 0, errors: parsed.errors };
  }

  const result = await importTeachersFromCsv(parsed.rows);
  revalidatePath("/admin/teachers");
  return {
    imported: result.imported,
    errors: [...parsed.errors, ...result.errors],
  };
}

export async function getTeacherAssignmentsAction(teacherId: string) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  return getTeacherAssignments(teacherId);
}

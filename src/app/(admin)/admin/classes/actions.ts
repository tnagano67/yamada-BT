"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { parseStudentCsv } from "@/lib/admin/csv-parser";
import {
  createClass,
  updateClass,
  deleteClass,
  importStudentsFromCsv,
  updateStudentStatus,
} from "@/lib/admin/class-service";
import type { ClassStudentStatus } from "@/generated/prisma/client";

export async function createClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const academicYear = Number(formData.get("academicYear"));
  const gradeYear = Number(formData.get("gradeYear"));
  const className = formData.get("className") as string;
  const homeroomTeacherId =
    (formData.get("homeroomTeacherId") as string) || undefined;

  await createClass({ academicYear, gradeYear, className, homeroomTeacherId });
  revalidatePath("/admin/classes");
}

export async function updateClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const id = formData.get("id") as string;
  const gradeYear = formData.has("gradeYear")
    ? Number(formData.get("gradeYear"))
    : undefined;
  const className = (formData.get("className") as string) || undefined;
  const rawTeacherId = formData.get("homeroomTeacherId") as string;
  const homeroomTeacherId = rawTeacherId || null;

  await updateClass(id, { gradeYear, className, homeroomTeacherId });
  revalidatePath("/admin/classes");
}

export async function deleteClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const id = formData.get("id") as string;
  await deleteClass(id);
  revalidatePath("/admin/classes");
}

export async function importStudentsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const csvText = formData.get("csvText") as string;
  const academicYear = Number(formData.get("academicYear"));

  const parsed = parseStudentCsv(csvText);
  if (parsed.errors.length > 0) {
    return { imported: 0, errors: parsed.errors };
  }

  const result = await importStudentsFromCsv(parsed.rows, academicYear);
  revalidatePath("/admin/classes");
  return result;
}

export async function updateStudentStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const classStudentId = formData.get("classStudentId") as string;
  const status = formData.get("status") as ClassStudentStatus;

  await updateStudentStatus(classStudentId, status);
  revalidatePath("/admin/classes");
}



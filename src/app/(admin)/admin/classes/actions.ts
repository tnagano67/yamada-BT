"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { parseStudentCsv, parseClassCsv } from "@/lib/admin/csv-parser";
import {
  createClass,
  updateClass,
  deleteClass,
  importStudentsFromCsv,
  importClassesFromCsv,
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

export async function importClassesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const csvText = formData.get("csvText") as string;
  const academicYear = Number(formData.get("academicYear"));

  const parsed = parseClassCsv(csvText);
  if (parsed.rows.length === 0) {
    return { imported: 0, errors: parsed.errors };
  }

  const result = await importClassesFromCsv(parsed.rows, academicYear);
  revalidatePath("/admin/classes");
  return {
    imported: result.imported,
    errors: [...parsed.errors, ...result.errors],
  };
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

export async function addStudentToClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;
  const studentNumber = Number(formData.get("studentNumber"));

  const { prisma } = await import("@/lib/db/prisma");

  await prisma.$transaction(async (tx) => {
    // Find or create student
    let student = await tx.user.findUnique({ where: { email } });
    if (student && student.role !== "student") {
      throw new Error("このメールアドレスは教員アカウントに使用されています");
    }
    if (!student) {
      student = await tx.user.create({
        data: { name, nameKana: nameKana || null, email, role: "student" },
      });
    }

    // Check if already in class
    const existing = await tx.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId: student.id } },
    });
    if (existing) {
      throw new Error("この生徒は既にこのクラスに所属しています");
    }

    await tx.classStudent.create({
      data: { classId, studentId: student.id, studentNumber },
    });
  });

  revalidatePath(`/admin/classes/${classId}`);
}

export async function removeStudentFromClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const classStudentId = formData.get("classStudentId") as string;
  const classId = formData.get("classId") as string;

  const { prisma } = await import("@/lib/db/prisma");
  await prisma.classStudent.delete({ where: { id: classStudentId } });

  revalidatePath(`/admin/classes/${classId}`);
}

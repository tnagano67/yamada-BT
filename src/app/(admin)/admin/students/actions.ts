"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/admin/student-service";
import { parseStudentCsv } from "@/lib/admin/csv-parser";
import { importStudentsFromCsv } from "@/lib/admin/class-service";

export async function createStudentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;

  await createStudent({ name, nameKana, email });
  revalidatePath("/admin/students");
}

export async function createStudentWithClassAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;
  const classId = (formData.get("classId") as string) || undefined;
  const studentNumber = formData.get("studentNumber")
    ? Number(formData.get("studentNumber"))
    : undefined;

  const { prisma } = await import("@/lib/db/prisma");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) throw new Error("このメールアドレスは既に登録されています");

    const student = await tx.user.create({
      data: { name, nameKana: nameKana || null, email, role: "student" },
    });

    if (classId && studentNumber) {
      await tx.classStudent.create({
        data: { classId, studentId: student.id, studentNumber },
      });
    }
  });

  revalidatePath("/admin/students");
}

export async function updateStudentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const nameKana = (formData.get("nameKana") as string) || undefined;
  const email = formData.get("email") as string;

  await updateStudent(userId, { name, nameKana, email });
  revalidatePath("/admin/students");
}

export async function deleteStudentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const userId = formData.get("userId") as string;

  await deleteStudent(userId);
  revalidatePath("/admin/students");
}

export async function importStudentsFromCsvAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const csvText = formData.get("csvText") as string;
  const academicYear = Number(formData.get("academicYear"));

  const parsed = parseStudentCsv(csvText);
  if (parsed.rows.length === 0) {
    return { imported: 0, errors: parsed.errors };
  }

  const result = await importStudentsFromCsv(parsed.rows, academicYear);
  revalidatePath("/admin/students");
  return {
    imported: result.imported,
    errors: [...parsed.errors, ...result.errors],
  };
}

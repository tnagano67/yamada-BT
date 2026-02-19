"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import {
  createGrade,
  updateGrade,
  deleteGrade,
} from "@/lib/admin/grade-service";
import type { Subject, GradeType } from "@/generated/prisma/client";

export async function createGradeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const id = formData.get("id") as string;
  const subject = formData.get("subject") as Subject;
  const gradeNumber = Number(formData.get("gradeNumber"));
  const gradeType = formData.get("gradeType") as GradeType;
  const wordStart = Number(formData.get("wordStart"));
  const wordEnd = Number(formData.get("wordEnd"));
  const reviewRangeStart = formData.get("reviewRangeStart")
    ? Number(formData.get("reviewRangeStart"))
    : undefined;
  const reviewRangeEnd = formData.get("reviewRangeEnd")
    ? Number(formData.get("reviewRangeEnd"))
    : undefined;
  const blockNumber = Number(formData.get("blockNumber"));

  await createGrade({
    id,
    subject,
    gradeNumber,
    gradeType,
    wordStart,
    wordEnd,
    reviewRangeStart,
    reviewRangeEnd,
    blockNumber,
  });

  revalidatePath("/admin/grades");
}

export async function updateGradeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const gradeId = formData.get("gradeId") as string;
  const gradeType = formData.get("gradeType") as GradeType;
  const wordStart = Number(formData.get("wordStart"));
  const wordEnd = Number(formData.get("wordEnd"));
  const reviewRangeStart = formData.get("reviewRangeStart")
    ? Number(formData.get("reviewRangeStart"))
    : undefined;
  const reviewRangeEnd = formData.get("reviewRangeEnd")
    ? Number(formData.get("reviewRangeEnd"))
    : undefined;
  const blockNumber = Number(formData.get("blockNumber"));

  await updateGrade(gradeId, {
    gradeType,
    wordStart,
    wordEnd,
    reviewRangeStart,
    reviewRangeEnd,
    blockNumber,
  });

  revalidatePath("/admin/grades");
}

export async function deleteGradeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const gradeId = formData.get("gradeId") as string;
  await deleteGrade(gradeId);
  revalidatePath("/admin/grades");
}

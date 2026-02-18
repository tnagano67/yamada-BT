"use server";

import { auth } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/roles";
import type { UserRole } from "@/generated/prisma/client";
import { canAccessStudent } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function addTeacherNote(
  studentId: string,
  content: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role as UserRole, "teacher")) {
    throw new Error("権限がありません");
  }

  const hasAccess = await canAccessStudent(
    session.user.id,
    session.user.role as UserRole,
    studentId,
  );
  if (!hasAccess) throw new Error("この生徒へのアクセス権がありません");

  await prisma.teacherNote.create({
    data: {
      teacherId: session.user.id,
      studentId,
      content: content.trim(),
    },
  });

  revalidatePath(`/teacher/students/${studentId}`);
}

export async function deleteTeacherNote(noteId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role as UserRole, "teacher")) {
    throw new Error("権限がありません");
  }

  // 自分が作成したメモのみ削除可能
  const note = await prisma.teacherNote.findFirst({
    where: { id: noteId, teacherId: session.user.id },
  });
  if (!note) throw new Error("メモが見つかりません");

  await prisma.teacherNote.delete({ where: { id: noteId } });

  revalidatePath(`/teacher/students/${note.studentId}`);
}

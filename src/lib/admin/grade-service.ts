import { prisma } from "@/lib/db/prisma";
import type { Prisma, Subject, GradeType } from "@/generated/prisma/client";

export async function getGradesPaginated(
  filter: {
    subject?: Subject;
    search?: string;
  },
  skip: number,
  take: number,
) {
  const where: Prisma.GradeWhereInput = {};

  if (filter.subject) {
    where.subject = filter.subject;
  }

  if (filter.search) {
    where.id = { contains: filter.search, mode: "insensitive" };
  }

  const [grades, totalCount] = await Promise.all([
    prisma.grade.findMany({
      where,
      include: {
        _count: { select: { words: true } },
      },
      orderBy: [{ subject: "asc" }, { gradeNumber: "asc" }],
      skip,
      take,
    }),
    prisma.grade.count({ where }),
  ]);

  return { grades, totalCount };
}

export async function getAllGrades() {
  return prisma.grade.findMany({
    select: { id: true, subject: true, gradeNumber: true },
    orderBy: [{ subject: "asc" }, { gradeNumber: "asc" }],
  });
}

export async function createGrade(data: {
  id: string;
  subject: Subject;
  gradeNumber: number;
  gradeType: GradeType;
  wordStart: number;
  wordEnd: number;
  reviewRangeStart?: number;
  reviewRangeEnd?: number;
  blockNumber: number;
}) {
  const existing = await prisma.grade.findUnique({ where: { id: data.id } });
  if (existing) {
    throw new Error(`グレードID "${data.id}" は既に存在します`);
  }

  const duplicate = await prisma.grade.findUnique({
    where: { subject_gradeNumber: { subject: data.subject, gradeNumber: data.gradeNumber } },
  });
  if (duplicate) {
    throw new Error(
      `${data.subject === "english" ? "英語" : "日本語"}のグレード番号 ${data.gradeNumber} は既に存在します`,
    );
  }

  return prisma.grade.create({
    data: {
      id: data.id,
      subject: data.subject,
      gradeNumber: data.gradeNumber,
      gradeType: data.gradeType,
      wordStart: data.wordStart,
      wordEnd: data.wordEnd,
      reviewRangeStart: data.reviewRangeStart ?? null,
      reviewRangeEnd: data.reviewRangeEnd ?? null,
      blockNumber: data.blockNumber,
    },
  });
}

export async function updateGrade(
  gradeId: string,
  data: {
    gradeType: GradeType;
    wordStart: number;
    wordEnd: number;
    reviewRangeStart?: number;
    reviewRangeEnd?: number;
    blockNumber: number;
  },
) {
  const existing = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!existing) {
    throw new Error("グレードが見つかりません");
  }

  return prisma.grade.update({
    where: { id: gradeId },
    data: {
      gradeType: data.gradeType,
      wordStart: data.wordStart,
      wordEnd: data.wordEnd,
      reviewRangeStart: data.reviewRangeStart ?? null,
      reviewRangeEnd: data.reviewRangeEnd ?? null,
      blockNumber: data.blockNumber,
    },
  });
}

export async function deleteGrade(gradeId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      _count: {
        select: {
          words: true,
          studentGrades: true,
          quizAttempts: true,
          promotionProgresses: true,
          reviewItems: true,
          semesterGoals: true,
        },
      },
    },
  });

  if (!grade) {
    throw new Error("グレードが見つかりません");
  }

  const refs: string[] = [];
  if (grade._count.words > 0) refs.push(`単語(${grade._count.words}件)`);
  if (grade._count.studentGrades > 0) refs.push(`生徒グレード(${grade._count.studentGrades}件)`);
  if (grade._count.quizAttempts > 0) refs.push(`クイズ(${grade._count.quizAttempts}件)`);
  if (grade._count.promotionProgresses > 0) refs.push(`昇格進捗(${grade._count.promotionProgresses}件)`);
  if (grade._count.reviewItems > 0) refs.push(`復習項目(${grade._count.reviewItems}件)`);
  if (grade._count.semesterGoals > 0) refs.push(`学期目標(${grade._count.semesterGoals}件)`);

  if (refs.length > 0) {
    throw new Error(
      `このグレードは ${refs.join("、")} に参照されているため削除できません`,
    );
  }

  return prisma.grade.delete({ where: { id: gradeId } });
}

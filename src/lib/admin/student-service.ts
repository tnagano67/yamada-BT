import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function getStudents(academicYear: number) {
  return prisma.user.findMany({
    where: { role: "student" },
    include: {
      classStudents: {
        where: { class: { academicYear } },
        include: {
          class: {
            select: { gradeYear: true, className: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getStudentsPaginated(
  academicYear: number,
  filter: {
    gradeYear?: number;
    className?: string;
    status?: string;
    unassigned?: boolean;
    search?: string;
  },
  skip: number,
  take: number,
) {
  const where: Prisma.UserWhereInput = { role: "student" };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { nameKana: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter.unassigned) {
    where.classStudents = { none: { class: { academicYear } } };
  } else {
    const classCondition: Prisma.ClassStudentWhereInput = {
      class: { academicYear },
    };
    if (filter.gradeYear) {
      classCondition.class = { ...classCondition.class as Prisma.ClassWhereInput, gradeYear: filter.gradeYear };
    }
    if (filter.className) {
      classCondition.class = { ...classCondition.class as Prisma.ClassWhereInput, className: filter.className };
    }
    if (filter.status) {
      classCondition.status = filter.status as Prisma.EnumClassStudentStatusFilter["equals"];
    }

    if (filter.gradeYear || filter.className || filter.status) {
      where.classStudents = { some: classCondition };
    }
  }

  const [students, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        classStudents: {
          where: { class: { academicYear } },
          include: {
            class: { select: { gradeYear: true, className: true } },
          },
        },
        studentGrades: {
          select: { subject: true, currentGradeId: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { students, totalCount };
}

export async function createStudent(data: {
  name: string;
  nameKana?: string;
  email: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("このメールアドレスは既に登録されています");
  }
  return prisma.user.create({
    data: {
      name: data.name,
      nameKana: data.nameKana || null,
      email: data.email,
      role: "student",
    },
  });
}

export async function updateStudent(
  userId: string,
  data: { name: string; nameKana?: string; email: string },
) {
  const existing = await prisma.user.findFirst({
    where: { email: data.email, id: { not: userId } },
  });
  if (existing) {
    throw new Error("このメールアドレスは既に他のユーザーに使用されています");
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      nameKana: data.nameKana || null,
      email: data.email,
    },
  });
}

export async function deleteStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("生徒が見つかりません");
  if (user.role !== "student") throw new Error("このユーザーは生徒ではありません");
  return prisma.user.delete({ where: { id: userId } });
}

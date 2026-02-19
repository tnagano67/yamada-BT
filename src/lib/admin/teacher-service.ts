import { prisma } from "@/lib/db/prisma";
import type {
  UserRole,
  TeacherAssignmentRole,
  Subject,
} from "@/generated/prisma/client";
import type { TeacherCsvRow } from "./csv-parser";

export async function createTeacher(data: {
  name: string;
  nameKana?: string;
  email: string;
  role: UserRole;
}) {
  const allowed: UserRole[] = ["teacher", "subject_lead", "admin"];
  if (!allowed.includes(data.role)) {
    throw new Error(`不正なロールです: ${data.role}`);
  }
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
      role: data.role,
    },
  });
}

export async function updateTeacher(
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

export async function deleteTeacher(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          teacherAssignments: true,
          homeroomClasses: true,
        },
      },
    },
  });
  if (!user) throw new Error("教員が見つかりません");
  if (user.role === "student") throw new Error("生徒は削除できません");
  if (user._count.teacherAssignments > 0 || user._count.homeroomClasses > 0) {
    throw new Error(
      "クラス担当が割り当てられている教員は削除できません。先に担当を解除してください。",
    );
  }
  return prisma.user.delete({ where: { id: userId } });
}

export async function getTeachers() {
  return prisma.user.findMany({
    where: { role: { in: ["teacher", "subject_lead", "admin"] } },
    include: {
      _count: { select: { teacherAssignments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function updateTeacherRole(userId: string, role: UserRole) {
  const allowed: UserRole[] = ["teacher", "subject_lead", "admin"];
  if (!allowed.includes(role)) {
    throw new Error(`不正なロールです: ${role}`);
  }
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function toggleTeacherActive(userId: string, isActive: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

export async function assignTeacherToClass(
  teacherId: string,
  classId: string,
  role: TeacherAssignmentRole,
  subject?: Subject,
) {
  const assignment = await prisma.teacherClassAssignment.create({
    data: { teacherId, classId, role, subject: subject ?? null },
  });

  if (role === "homeroom") {
    await prisma.class.update({
      where: { id: classId },
      data: { homeroomTeacherId: teacherId },
    });
  }

  return assignment;
}

export async function removeTeacherAssignment(assignmentId: string) {
  const assignment = await prisma.teacherClassAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw new Error("担当が見つかりません");

  await prisma.teacherClassAssignment.delete({ where: { id: assignmentId } });

  if (assignment.role === "homeroom") {
    await prisma.class.update({
      where: { id: assignment.classId },
      data: { homeroomTeacherId: null },
    });
  }
}

export async function getTeacherAssignments(teacherId: string) {
  return prisma.teacherClassAssignment.findMany({
    where: { teacherId },
    include: {
      class: {
        select: {
          id: true,
          academicYear: true,
          gradeYear: true,
          className: true,
        },
      },
    },
  });
}

export async function getTeachersPaginated(
  filter: {
    role?: string;
    isActive?: boolean;
    search?: string;
  },
  skip: number,
  take: number,
) {
  const where: Record<string, unknown> = {
    role: { in: ["teacher", "subject_lead", "admin"] },
  };
  if (filter.role) where.role = filter.role;
  if (filter.isActive !== undefined) where.isActive = filter.isActive;
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { nameKana: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [teachers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { teacherAssignments: true } } },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { teachers, totalCount };
}

export async function getTeacherStats() {
  const [teacherCount, subjectLeadCount, adminCount, activeCount, inactiveCount] =
    await Promise.all([
      prisma.user.count({ where: { role: "teacher" } }),
      prisma.user.count({ where: { role: "subject_lead" } }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.count({
        where: { role: { in: ["teacher", "subject_lead", "admin"] }, isActive: true },
      }),
      prisma.user.count({
        where: { role: { in: ["teacher", "subject_lead", "admin"] }, isActive: false },
      }),
    ]);
  return { teacherCount, subjectLeadCount, adminCount, activeCount, inactiveCount };
}

export async function importTeachersFromCsv(
  rows: TeacherCsvRow[],
): Promise<{ imported: number; errors: { line: number; message: string }[] }> {
  let imported = 0;
  const errors: { line: number; message: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 1;
      try {
        await tx.user.upsert({
          where: { email: row.email },
          update: {
            name: row.name,
            nameKana: row.nameKana,
            role: row.role,
          },
          create: {
            name: row.name,
            nameKana: row.nameKana,
            email: row.email,
            role: row.role,
          },
        });
        imported++;
      } catch (err) {
        errors.push({
          line: lineNumber,
          message:
            err instanceof Error ? err.message : "データベースエラー",
        });
      }
    }
  });

  return { imported, errors };
}

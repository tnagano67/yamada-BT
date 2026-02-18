import { prisma } from "@/lib/db/prisma";
import type {
  UserRole,
  TeacherAssignmentRole,
  Subject,
} from "@/generated/prisma/client";

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

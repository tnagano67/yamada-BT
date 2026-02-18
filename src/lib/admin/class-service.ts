import { prisma } from "@/lib/db/prisma";
import type { ClassStudentStatus } from "@/generated/prisma/client";
import type { StudentCsvRow } from "./csv-parser";

export async function getClasses(academicYear: number) {
  return prisma.class.findMany({
    where: { academicYear },
    include: {
      homeroomTeacher: { select: { id: true, name: true } },
      _count: { select: { classStudents: true } },
    },
    orderBy: [{ gradeYear: "asc" }, { className: "asc" }],
  });
}

export async function createClass(data: {
  academicYear: number;
  gradeYear: number;
  className: string;
  homeroomTeacherId?: string;
}) {
  return prisma.class.create({
    data: {
      academicYear: data.academicYear,
      gradeYear: data.gradeYear,
      className: data.className,
      homeroomTeacherId: data.homeroomTeacherId ?? null,
    },
  });
}

export async function updateClass(
  id: string,
  data: { gradeYear?: number; className?: string; homeroomTeacherId?: string | null },
) {
  return prisma.class.update({ where: { id }, data });
}

export async function deleteClass(id: string) {
  return prisma.class.delete({ where: { id } });
}

export async function getStudentsByClass(classId: string) {
  return prisma.classStudent.findMany({
    where: { classId },
    include: {
      student: { select: { id: true, name: true, nameKana: true, email: true } },
    },
    orderBy: { studentNumber: "asc" },
  });
}

export async function importStudentsFromCsv(
  rows: StudentCsvRow[],
  academicYear: number,
): Promise<{ imported: number; errors: { line: number; message: string }[] }> {
  const errors: { line: number; message: string }[] = [];
  let imported = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 1;

      try {
        // 1. Upsert User by email
        const user = await tx.user.upsert({
          where: { email: row.email },
          update: { name: row.name, nameKana: row.nameKana },
          create: {
            email: row.email,
            name: row.name,
            nameKana: row.nameKana,
            role: "student",
          },
        });

        // 2. Find or create Class
        const cls = await tx.class.upsert({
          where: {
            academicYear_gradeYear_className: {
              academicYear,
              gradeYear: row.gradeYear,
              className: row.className,
            },
          },
          update: {},
          create: {
            academicYear,
            gradeYear: row.gradeYear,
            className: row.className,
          },
        });

        // 3. Upsert ClassStudent
        await tx.classStudent.upsert({
          where: {
            classId_studentId: {
              classId: cls.id,
              studentId: user.id,
            },
          },
          update: { studentNumber: row.studentNumber },
          create: {
            classId: cls.id,
            studentId: user.id,
            studentNumber: row.studentNumber,
          },
        });

        imported++;
      } catch (e) {
        errors.push({
          line: lineNumber,
          message: e instanceof Error ? e.message : "不明なエラー",
        });
      }
    }
  });

  return { imported, errors };
}

export async function updateStudentStatus(
  classStudentId: string,
  status: ClassStudentStatus,
) {
  return prisma.classStudent.update({
    where: { id: classStudentId },
    data: { status },
  });
}



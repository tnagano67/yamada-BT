import { prisma } from "@/lib/db/prisma";

export interface StudentDetailData {
  id: string;
  name: string | null;
  nameKana: string | null;
  classInfo: string | null;
  englishGrade: {
    currentGradeId: string;
    consecutivePasses: number;
  } | null;
  japaneseGrade: {
    currentGradeId: string;
    consecutivePasses: number;
  } | null;
  streak: {
    currentStreak: number;
    maxStreak: number;
    flameLevel: number;
  } | null;
  recentAttempts: {
    id: string;
    mode: string;
    gradeId: string;
    scorePercentage: number | null;
    isPassed: boolean | null;
    submittedAt: Date | null;
  }[];
  alerts: {
    id: string;
    alertType: string;
    severity: string;
    message: string;
    createdAt: Date;
  }[];
  notes: {
    id: string;
    content: string;
    teacherName: string | null;
    createdAt: Date;
  }[];
}

/**
 * 教員向け個別生徒詳細データを取得する
 */
export async function getStudentDetail(
  studentId: string,
  teacherId: string,
): Promise<StudentDetailData | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      nameKana: true,
      classStudents: {
        where: { status: "active" },
        include: {
          class: { select: { gradeYear: true, className: true } },
        },
        take: 1,
      },
    },
  });

  if (!student) return null;

  const classInfo =
    student.classStudents.length > 0
      ? `${student.classStudents[0].class.gradeYear}年${student.classStudents[0].class.className}組`
      : null;

  const [
    englishGrade,
    japaneseGrade,
    englishProgress,
    japaneseProgress,
    streak,
    recentAttempts,
    alerts,
    notes,
  ] = await Promise.all([
    prisma.studentGrade.findUnique({
      where: { studentId_subject: { studentId, subject: "english" } },
      select: { currentGradeId: true },
    }),
    prisma.studentGrade.findUnique({
      where: { studentId_subject: { studentId, subject: "japanese" } },
      select: { currentGradeId: true },
    }),
    prisma.promotionProgress.findUnique({
      where: { studentId_subject: { studentId, subject: "english" } },
      select: { consecutivePasses: true },
    }),
    prisma.promotionProgress.findUnique({
      where: { studentId_subject: { studentId, subject: "japanese" } },
      select: { consecutivePasses: true },
    }),
    prisma.studentStreak.findUnique({
      where: { studentId },
      select: { currentStreak: true, maxStreak: true, flameLevel: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId, submittedAt: { not: null } },
      select: {
        id: true,
        mode: true,
        gradeId: true,
        scorePercentage: true,
        isPassed: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
    prisma.teacherAlert.findMany({
      where: { teacherId, studentId, isAcknowledged: false },
      select: {
        id: true,
        alertType: true,
        severity: true,
        message: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacherNote.findMany({
      where: { studentId },
      include: {
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    id: student.id,
    name: student.name,
    nameKana: student.nameKana,
    classInfo,
    englishGrade: englishGrade
      ? {
          currentGradeId: englishGrade.currentGradeId,
          consecutivePasses: englishProgress?.consecutivePasses ?? 0,
        }
      : null,
    japaneseGrade: japaneseGrade
      ? {
          currentGradeId: japaneseGrade.currentGradeId,
          consecutivePasses: japaneseProgress?.consecutivePasses ?? 0,
        }
      : null,
    streak,
    recentAttempts,
    alerts,
    notes: notes.map((n) => ({
      id: n.id,
      content: n.content,
      teacherName: n.teacher.name,
      createdAt: n.createdAt,
    })),
  };
}

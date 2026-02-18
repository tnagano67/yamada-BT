import { prisma } from "@/lib/db/prisma";
import { todayJST } from "@/lib/date-utils";

export interface ClassOverview {
  classId: string;
  className: string;
  gradeYear: number;
  academicYear: number;
  homeroomTeacher: string | null;
  totalStudents: number;
  todayTestedCount: number;
  todayAttendanceRate: number;
  todayAverageScore: number | null;
}

export interface GradeDistributionItem {
  gradeId: string;
  count: number;
}

export interface ClassStudentItem {
  studentId: string;
  studentNumber: number;
  name: string | null;
  nameKana: string | null;
  englishGrade: string | null;
  japaneseGrade: string | null;
  currentStreak: number;
}

export interface ClassTestResultItem {
  studentId: string;
  studentNumber: number;
  name: string | null;
  score: number | null;
  scorePercentage: number | null;
  isPassed: boolean | null;
  submittedAt: Date | null;
}

/**
 * クラス概要データを取得する
 */
export async function getClassOverview(
  classId: string,
): Promise<ClassOverview | null> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      homeroomTeacher: { select: { name: true } },
      classStudents: {
        where: { status: "active" },
        select: { studentId: true },
      },
    },
  });

  if (!cls) return null;

  const today = todayJST();
  const studentIds = cls.classStudents.map((cs) => cs.studentId);

  // 本日の配信と受験状況
  let todayTestedCount = 0;
  let todayAverageScore: number | null = null;

  const delivery = await prisma.quizDelivery.findFirst({
    where: { date: today },
    orderBy: { deliveryTime: "desc" },
  });

  if (delivery && studentIds.length > 0) {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        deliveryId: delivery.id,
        studentId: { in: studentIds },
        submittedAt: { not: null },
      },
      select: { scorePercentage: true },
    });

    todayTestedCount = attempts.length;
    const scores = attempts
      .filter((a) => a.scorePercentage !== null)
      .map((a) => a.scorePercentage!);
    todayAverageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
  }

  return {
    classId: cls.id,
    className: `${cls.gradeYear}年${cls.className}組`,
    gradeYear: cls.gradeYear,
    academicYear: cls.academicYear,
    homeroomTeacher: cls.homeroomTeacher?.name ?? null,
    totalStudents: studentIds.length,
    todayTestedCount,
    todayAttendanceRate:
      studentIds.length > 0
        ? Math.round((todayTestedCount / studentIds.length) * 100)
        : 0,
    todayAverageScore,
  };
}

/**
 * クラスのグレード分布を取得する
 */
export async function getGradeDistribution(
  classId: string,
  subject: "english" | "japanese",
): Promise<GradeDistributionItem[]> {
  const classStudents = await prisma.classStudent.findMany({
    where: { classId, status: "active" },
    select: { studentId: true },
  });

  const studentIds = classStudents.map((cs) => cs.studentId);
  if (studentIds.length === 0) return [];

  const grades = await prisma.studentGrade.findMany({
    where: {
      studentId: { in: studentIds },
      subject,
    },
    select: { currentGradeId: true },
  });

  const distribution = new Map<string, number>();
  for (const g of grades) {
    distribution.set(
      g.currentGradeId,
      (distribution.get(g.currentGradeId) ?? 0) + 1,
    );
  }

  return [...distribution.entries()]
    .map(([gradeId, count]) => ({ gradeId, count }))
    .sort((a, b) => a.gradeId.localeCompare(b.gradeId, undefined, { numeric: true }));
}

/**
 * クラスの生徒一覧を取得する
 */
export async function getClassStudentList(
  classId: string,
): Promise<ClassStudentItem[]> {
  const classStudents = await prisma.classStudent.findMany({
    where: { classId, status: "active" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          nameKana: true,
          studentGrades: {
            select: { subject: true, currentGradeId: true },
          },
          studentStreak: {
            select: { currentStreak: true },
          },
        },
      },
    },
    orderBy: { studentNumber: "asc" },
  });

  return classStudents.map((cs) => {
    const englishGrade =
      cs.student.studentGrades.find((g) => g.subject === "english")
        ?.currentGradeId ?? null;
    const japaneseGrade =
      cs.student.studentGrades.find((g) => g.subject === "japanese")
        ?.currentGradeId ?? null;

    return {
      studentId: cs.student.id,
      studentNumber: cs.studentNumber,
      name: cs.student.name,
      nameKana: cs.student.nameKana,
      englishGrade,
      japaneseGrade,
      currentStreak: cs.student.studentStreak?.currentStreak ?? 0,
    };
  });
}

/**
 * クラスの本日のテスト結果を取得する
 */
export async function getClassTestResults(
  classId: string,
): Promise<ClassTestResultItem[]> {
  const today = todayJST();

  const classStudents = await prisma.classStudent.findMany({
    where: { classId, status: "active" },
    include: {
      student: {
        select: { id: true, name: true },
      },
    },
    orderBy: { studentNumber: "asc" },
  });

  const delivery = await prisma.quizDelivery.findFirst({
    where: { date: today },
    orderBy: { deliveryTime: "desc" },
  });

  const studentIds = classStudents.map((cs) => cs.student.id);
  const attemptMap = new Map<string, {
    score: number | null;
    scorePercentage: number | null;
    isPassed: boolean | null;
    submittedAt: Date | null;
  }>();

  if (delivery && studentIds.length > 0) {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        deliveryId: delivery.id,
        studentId: { in: studentIds },
      },
      select: {
        studentId: true,
        score: true,
        scorePercentage: true,
        isPassed: true,
        submittedAt: true,
      },
    });

    for (const a of attempts) {
      attemptMap.set(a.studentId, {
        score: a.score,
        scorePercentage: a.scorePercentage,
        isPassed: a.isPassed,
        submittedAt: a.submittedAt,
      });
    }
  }

  return classStudents.map((cs) => {
    const attempt = attemptMap.get(cs.student.id);
    return {
      studentId: cs.student.id,
      studentNumber: cs.studentNumber,
      name: cs.student.name,
      score: attempt?.score ?? null,
      scorePercentage: attempt?.scorePercentage ?? null,
      isPassed: attempt?.isPassed ?? null,
      submittedAt: attempt?.submittedAt ?? null,
    };
  });
}

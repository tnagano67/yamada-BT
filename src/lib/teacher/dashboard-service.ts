import { prisma } from "@/lib/db/prisma";
import { todayJST } from "@/lib/date-utils";

export interface ClassDailySummary {
  classId: string;
  className: string;
  gradeYear: number;
  totalStudents: number;
  testedCount: number;
  attendanceRate: number;
  averageScore: number | null;
}

export interface TeacherDailySummaryData {
  date: Date;
  hasActiveDelivery: boolean;
  deliveryStatus: string | null;
  classes: ClassDailySummary[];
  totalStudents: number;
  totalTested: number;
  overallAttendanceRate: number;
  overallAverageScore: number | null;
}

export interface RecentPromotionData {
  studentName: string;
  gradeId: string;
  subject: string;
  promotedAt: Date;
  classInfo: string;
}

/**
 * 教員の本日のダッシュボードデータを取得する
 */
export async function getTeacherDailySummary(
  teacherId: string,
  date?: Date,
): Promise<TeacherDailySummaryData> {
  const targetDate = date ?? todayJST();

  // 担当クラスを取得
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { teacherId },
    include: {
      class: {
        include: {
          classStudents: {
            where: { status: "active" },
            select: { studentId: true },
          },
        },
      },
    },
  });

  // 本日の配信を取得
  const delivery = await prisma.quizDelivery.findFirst({
    where: { date: targetDate },
    orderBy: { deliveryTime: "desc" },
  });

  // クラスごとのサマリーを計算
  const classes: ClassDailySummary[] = [];
  let totalStudents = 0;
  let totalTested = 0;
  const allScores: number[] = [];

  // 重複クラスを排除
  const seenClassIds = new Set<string>();

  for (const assignment of assignments) {
    if (seenClassIds.has(assignment.classId)) continue;
    seenClassIds.add(assignment.classId);

    const cls = assignment.class;
    const studentIds = cls.classStudents.map((cs) => cs.studentId);
    const classTotal = studentIds.length;

    let testedCount = 0;
    let classScoreSum = 0;
    let classScoreCount = 0;

    if (delivery && studentIds.length > 0) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          deliveryId: delivery.id,
          studentId: { in: studentIds },
          submittedAt: { not: null },
        },
        select: { scorePercentage: true },
      });

      testedCount = attempts.length;
      for (const a of attempts) {
        if (a.scorePercentage !== null) {
          classScoreSum += a.scorePercentage;
          classScoreCount++;
          allScores.push(a.scorePercentage);
        }
      }
    }

    classes.push({
      classId: cls.id,
      className: `${cls.gradeYear}年${cls.className}組`,
      gradeYear: cls.gradeYear,
      totalStudents: classTotal,
      testedCount,
      attendanceRate: classTotal > 0 ? Math.round((testedCount / classTotal) * 100) : 0,
      averageScore:
        classScoreCount > 0
          ? Math.round(classScoreSum / classScoreCount)
          : null,
    });

    totalStudents += classTotal;
    totalTested += testedCount;
  }

  // クラス名でソート
  classes.sort((a, b) => {
    if (a.gradeYear !== b.gradeYear) return a.gradeYear - b.gradeYear;
    return a.className.localeCompare(b.className);
  });

  return {
    date: targetDate,
    hasActiveDelivery: delivery !== null,
    deliveryStatus: delivery?.status ?? null,
    classes,
    totalStudents,
    totalTested,
    overallAttendanceRate:
      totalStudents > 0
        ? Math.round((totalTested / totalStudents) * 100)
        : 0,
    overallAverageScore:
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null,
  };
}

/**
 * 最近の昇格リストを取得する (教員の担当クラスの生徒)
 */
export async function getRecentPromotions(
  teacherId: string,
  limit: number = 10,
): Promise<RecentPromotionData[]> {
  // 担当クラスの生徒IDを取得
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { teacherId },
    select: {
      class: {
        select: {
          gradeYear: true,
          className: true,
          classStudents: {
            where: { status: "active" },
            select: { studentId: true },
          },
        },
      },
    },
  });

  const studentClassMap = new Map<string, string>();
  const studentIds: string[] = [];

  for (const a of assignments) {
    const classInfo = `${a.class.gradeYear}年${a.class.className}組`;
    for (const cs of a.class.classStudents) {
      if (!studentClassMap.has(cs.studentId)) {
        studentIds.push(cs.studentId);
      }
      studentClassMap.set(cs.studentId, classInfo);
    }
  }

  if (studentIds.length === 0) return [];

  const recentGrades = await prisma.studentGrade.findMany({
    where: {
      studentId: { in: studentIds },
      promotedAt: { not: null },
    },
    include: {
      student: { select: { name: true } },
    },
    orderBy: { promotedAt: "desc" },
    take: limit,
  });

  return recentGrades.map((g) => ({
    studentName: g.student.name ?? "名前未設定",
    gradeId: g.currentGradeId,
    subject: g.subject,
    promotedAt: g.promotedAt!,
    classInfo: studentClassMap.get(g.studentId) ?? "",
  }));
}

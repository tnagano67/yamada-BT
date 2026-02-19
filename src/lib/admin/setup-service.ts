import { prisma } from "@/lib/db/prisma";

export interface SetupStatus {
  hasTeachers: boolean;
  teacherCount: number;
  hasClasses: boolean;
  classCount: number;
  hasStudents: boolean;
  studentCount: number;
}

export async function getSetupStatus(
  academicYear: number,
): Promise<SetupStatus> {
  const [teacherCount, classCount, studentCount] = await Promise.all([
    prisma.user.count({
      where: { role: { in: ["teacher", "subject_lead"] }, isActive: true },
    }),
    prisma.class.count({ where: { academicYear } }),
    prisma.user.count({ where: { role: "student" } }),
  ]);

  return {
    hasTeachers: teacherCount > 0,
    teacherCount,
    hasClasses: classCount > 0,
    classCount,
    hasStudents: studentCount > 0,
    studentCount,
  };
}

/**
 * 全データをリセットする（管理者ユーザーとマスターデータは保持）
 *
 * 保持対象: adminユーザー、Grade、Word、BadgeMaster
 * 削除対象: 非adminユーザー、クラス、クイズ関連、ストリーク、通知、アラート、スケジュール等
 */
export async function resetAllData(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Class.homeroomTeacherId を全て null に（FK制約を解除）
    await tx.class.updateMany({
      data: { homeroomTeacherId: null },
    });

    // 2. 非adminユーザーを削除
    //    カスケード削除: Account, Session, ClassStudent, TeacherClassAssignment,
    //    StudentGrade, QuizAttempt(→QuizAnswer), PromotionProgress,
    //    StudentStreak, StreakDailyLog, ReviewItem, StudentBadge,
    //    StudentBadgeReveal, SemesterGoal, Notification, NotificationSetting,
    //    TeacherAlert, TeacherNote
    await tx.user.deleteMany({
      where: { role: { not: "admin" } },
    });

    // 3. クラスを全削除（残りのTeacherClassAssignmentもカスケード削除）
    await tx.class.deleteMany();

    // 4. クイズ配信・スケジュール関連
    await tx.quizDelivery.deleteMany();
    await tx.quizSchedule.deleteMany();

    // 5. カレンダー・学期・スケジュール関連
    await tx.schoolCalendar.deleteMany();
    await tx.semester.deleteMany();
    await tx.scheduleSuspension.deleteMany();
  });
}

export type ResetScope =
  | "students"
  | "classes_students"
  | "quiz_data"
  | "calendar"
  | "all";

/**
 * 部分リセット — 指定スコープのデータのみ削除
 */
export async function resetPartialData(scope: ResetScope): Promise<void> {
  await prisma.$transaction(async (tx) => {
    switch (scope) {
      case "students":
        // Delete student users (cascades: ClassStudent, StudentGrade, QuizAttempt, etc.)
        await tx.user.deleteMany({ where: { role: "student" } });
        break;

      case "classes_students":
        // Remove homeroom references first
        await tx.class.updateMany({ data: { homeroomTeacherId: null } });
        // Delete students
        await tx.user.deleteMany({ where: { role: "student" } });
        // Delete classes (cascades: ClassStudent, TeacherClassAssignment)
        await tx.class.deleteMany();
        break;

      case "quiz_data":
        // Delete quiz attempts, deliveries, schedules
        await tx.quizAnswer.deleteMany();
        await tx.quizAttempt.deleteMany();
        await tx.quizDelivery.deleteMany();
        await tx.quizSchedule.deleteMany();
        // Delete promotion progress
        await tx.promotionProgress.deleteMany();
        // Delete streaks
        await tx.streakDailyLog.deleteMany();
        await tx.studentStreak.deleteMany();
        // Delete review items
        await tx.reviewItem.deleteMany();
        // Delete badges
        await tx.studentBadgeReveal.deleteMany();
        await tx.studentBadge.deleteMany();
        // Delete semester goals
        await tx.semesterGoal.deleteMany();
        break;

      case "calendar":
        await tx.schoolCalendar.deleteMany();
        await tx.semester.deleteMany();
        await tx.scheduleSuspension.deleteMany();
        break;

      case "all":
        // Same as resetAllData
        await tx.class.updateMany({ data: { homeroomTeacherId: null } });
        await tx.user.deleteMany({ where: { role: { not: "admin" } } });
        await tx.class.deleteMany();
        await tx.quizDelivery.deleteMany();
        await tx.quizSchedule.deleteMany();
        await tx.schoolCalendar.deleteMany();
        await tx.semester.deleteMany();
        await tx.scheduleSuspension.deleteMany();
        break;
    }
  });
}

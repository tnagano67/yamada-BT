import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { ActiveTestBanner } from "@/components/quiz/ActiveTestBanner";
import { GradeCard } from "@/components/grade/GradeCard";
import { StreakDisplay } from "@/components/streak/StreakDisplay";
import { RecentResultsList } from "@/components/student/RecentResultsList";
import { SemesterProgressCard } from "@/components/student/SemesterProgressCard";
import { startQuiz } from "@/app/(student)/student/quiz/actions";
import { getGradeProgressData } from "@/lib/grade/grade-service";
import { getStreakDisplayData } from "@/lib/streak/streak-service";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // 並列フェッチ
  const [
    activeDelivery,
    englishGrade,
    japaneseGrade,
    streakData,
    recentAttempts,
    semesterGoal,
  ] = await Promise.all([
    prisma.quizDelivery.findFirst({
      where: { status: "active" },
      orderBy: { deliveryTime: "desc" },
    }),
    getGradeProgressData(userId, "english"),
    getGradeProgressData(userId, "japanese"),
    getStreakDisplayData(userId),
    prisma.quizAttempt.findMany({
      where: { studentId: userId, submittedAt: { not: null } },
      select: {
        id: true,
        mode: true,
        gradeId: true,
        scorePercentage: true,
        isPassed: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.semesterGoal.findFirst({
      where: { studentId: userId, status: "in_progress" },
      include: {
        targetGrade: { select: { id: true, gradeNumber: true, subject: true } },
      },
    }),
  ]);

  // アクティブ配信がある場合、受験済みか確認
  let alreadyTaken = false;
  if (activeDelivery) {
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        studentId: userId,
        deliveryId: activeDelivery.id,
        submittedAt: { not: null },
      },
    });
    alreadyTaken = !!existingAttempt;
  }

  // 学期目標の進捗計算
  let semesterProgressData: {
    subject: string;
    currentGradeId: string;
    targetGradeId: string;
    progressPercent: number;
  } | null = null;

  if (semesterGoal) {
    const currentGrade = await prisma.studentGrade.findUnique({
      where: {
        studentId_subject: {
          studentId: userId,
          subject: semesterGoal.targetGrade.subject,
        },
      },
      include: { currentGrade: { select: { gradeNumber: true } } },
    });

    if (currentGrade) {
      const target = semesterGoal.targetGrade.gradeNumber;
      const current = currentGrade.currentGrade.gradeNumber;
      semesterProgressData = {
        subject: semesterGoal.targetGrade.subject,
        currentGradeId: currentGrade.currentGradeId,
        targetGradeId: semesterGoal.targetGrade.id,
        progressPercent: target > 0 ? Math.round((current / target) * 100) : 0,
      };
    }
  }

  async function handleStartTest(formData: FormData) {
    "use server";
    const deliveryId = formData.get("deliveryId") as string;
    await startQuiz("morning_test", deliveryId);
  }

  async function handleStartQuick() {
    "use server";
    await startQuiz("quick");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>

      <div className="space-y-4">
        {/* アクティブテストバナー */}
        {activeDelivery ? (
          <ActiveTestBanner
            deliveryId={activeDelivery.id}
            subject={activeDelivery.subject}
            deadlineTime={activeDelivery.deadlineTime}
            alreadyTaken={alreadyTaken}
            startAction={handleStartTest}
          />
        ) : null}

        {/* グレード・ストリーク 3カラム */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* ストリーク */}
          {streakData ? (
            <StreakDisplay data={streakData} />
          ) : (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">ストリーク</p>
              <p className="text-muted-foreground text-sm">記録なし</p>
            </div>
          )}

          {/* 英語グレード */}
          {englishGrade ? (
            <GradeCard data={englishGrade} startQuickAction={handleStartQuick} />
          ) : (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">英語グレード</p>
              <p className="text-muted-foreground text-sm">未設定</p>
              <form action={handleStartQuick} className="mt-2">
                <button
                  type="submit"
                  className="text-primary text-sm underline underline-offset-4 hover:no-underline"
                >
                  テストを開始して設定
                </button>
              </form>
            </div>
          )}

          {/* 日本語グレード */}
          {japaneseGrade ? (
            <GradeCard data={japaneseGrade} startQuickAction={handleStartQuick} />
          ) : (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">日本語グレード</p>
              <p className="text-muted-foreground text-sm">未設定</p>
            </div>
          )}
        </div>

        {/* 学期目標 */}
        {semesterProgressData ? (
          <SemesterProgressCard
            subject={semesterProgressData.subject}
            currentGradeId={semesterProgressData.currentGradeId}
            targetGradeId={semesterProgressData.targetGradeId}
            progressPercent={semesterProgressData.progressPercent}
          />
        ) : null}

        {/* 直近のテスト結果 */}
        <RecentResultsList results={recentAttempts} />

        {/* 学習導線リンク */}
        <div className="flex gap-3">
          <Link
            href="/student/study"
            className="text-primary text-sm underline underline-offset-4 hover:no-underline"
          >
            自習モードで学習する
          </Link>
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActiveTestBanner } from "@/components/quiz/ActiveTestBanner";
import { GradeCard } from "@/components/grade/GradeCard";
import { startQuiz } from "@/app/(student)/student/quiz/actions";
import { getGradeProgressData } from "@/lib/grade/grade-service";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // 並列フェッチ（配信状態、グレード進捗、ストリーク）
  const [activeDelivery, gradeProgress, streak] = await Promise.all([
    prisma.quizDelivery.findFirst({
      where: { status: "active" },
      orderBy: { deliveryTime: "desc" },
    }),
    getGradeProgressData(userId, "english"),
    prisma.studentStreak.findUnique({
      where: { studentId: userId },
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 今日のテスト */}
          <Card>
            <CardHeader>
              <CardTitle>今日のテスト</CardTitle>
              <CardDescription>朝テストの状況</CardDescription>
            </CardHeader>
            <CardContent>
              {activeDelivery ? (
                alreadyTaken ? (
                  <p className="text-green-600 dark:text-green-400">受験済み</p>
                ) : (
                  <p className="text-orange-600 dark:text-orange-400">未受験</p>
                )
              ) : (
                <p className="text-muted-foreground">配信なし</p>
              )}
            </CardContent>
          </Card>

          {/* 現在のグレード */}
          {gradeProgress ? (
            <GradeCard data={gradeProgress} startQuickAction={handleStartQuick} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>現在のグレード</CardTitle>
                <CardDescription>英語</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">グレード未設定</p>
                <form action={handleStartQuick} className="mt-3">
                  <button
                    type="submit"
                    className="text-primary text-sm underline underline-offset-4 hover:no-underline"
                  >
                    テストを開始して設定
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ストリーク */}
          <Card>
            <CardHeader>
              <CardTitle>ストリーク</CardTitle>
              <CardDescription>連続学習記録</CardDescription>
            </CardHeader>
            <CardContent>
              {streak ? (
                <p className="text-3xl font-bold">
                  {streak.currentStreak}
                  <span className="text-muted-foreground ml-1 text-base font-normal">
                    日連続
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">記録なし</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

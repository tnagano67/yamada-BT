import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { todayJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import {
  ensureStudentGrade,
  getGradeProgressData,
  getPromotionAttemptsRemaining,
} from "@/lib/grade/grade-service";
import { CONSECUTIVE_PASSES_REQUIRED } from "@/lib/grade/constants";
import { getRecommendation } from "@/lib/quiz/recommendation";
import { startQuiz } from "@/app/(student)/student/quiz/actions";
import { RecommendationCard } from "@/components/study/RecommendationCard";
import {
  QuickPracticeCard,
  PromotionChallengeCard,
  WeaknessPracticeCard,
} from "@/components/study/StudyModeCard";

export default async function StudyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // グレードを確保
  const studentGrade = await ensureStudentGrade(userId, "english");

  // 並列フェッチ
  const [gradeProgress, promotionAttempts, incorrectCount, todayAttempt] =
    await Promise.all([
      getGradeProgressData(userId, "english"),
      getPromotionAttemptsRemaining(userId, "english"),
      // 現在グレードの単語プールに対する誤答数
      prisma.quizAnswer.count({
        where: {
          attempt: { studentId: userId },
          word: { gradeId: studentGrade.currentGradeId },
          isCorrect: false,
        },
      }),
      // 今日学習したか
      prisma.quizAttempt.findFirst({
        where: {
          studentId: userId,
          startedAt: {
            gte: todayJST(),
          },
        },
        select: { id: true },
      }),
    ]);

  const recommendation = getRecommendation({
    consecutivePasses: gradeProgress?.consecutivePasses ?? 0,
    promotionAttemptsRemaining: promotionAttempts.remaining,
    incorrectWordCount: incorrectCount,
    hasStudiedToday: !!todayAttempt,
    isMaxGrade: gradeProgress?.isMaxGrade ?? false,
  });

  async function handleStartByMode(mode: string) {
    "use server";
    await startQuiz(mode as "quick" | "promotion");
  }

  async function handleStartQuick() {
    "use server";
    await startQuiz("quick");
  }

  async function handleStartPromotion() {
    "use server";
    await startQuiz("promotion");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">自学自習</h1>

      <div className="space-y-4">
        {/* おすすめカード */}
        {recommendation ? (
          <RecommendationCard
            recommendation={recommendation}
            startAction={handleStartByMode}
          />
        ) : null}

        {/* モード選択グリッド */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickPracticeCard
            gradeId={studentGrade.currentGradeId}
            startAction={handleStartQuick}
          />

          <PromotionChallengeCard
            consecutivePasses={gradeProgress?.consecutivePasses ?? 0}
            requiredPasses={CONSECUTIVE_PASSES_REQUIRED}
            attemptsRemaining={promotionAttempts.remaining}
            isMaxGrade={gradeProgress?.isMaxGrade ?? false}
            startAction={handleStartPromotion}
          />

          <WeaknessPracticeCard />
        </div>
      </div>
    </div>
  );
}

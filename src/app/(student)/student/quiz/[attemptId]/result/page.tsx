import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { QuizResult } from "@/components/quiz/QuizResult";
import { QuizResultDetail } from "@/components/quiz/QuizResultDetail";
import { PromotionNotification } from "@/components/grade/PromotionNotification";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ResultPageProps {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ promoted?: string; newGrade?: string }>;
}

export default async function QuizResultPage({
  params,
  searchParams,
}: ResultPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [{ attemptId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        select: {
          correctOption: true,
          selectedOption: true,
          isCorrect: true,
          word: {
            select: { word: true, meaning: true },
          },
        },
      },
    },
  });

  if (!attempt || attempt.studentId !== session.user.id) {
    notFound();
  }

  // 未提出ならクイズページへ
  if (!attempt.submittedAt) {
    redirect(`/student/quiz/${attemptId}`);
  }

  const isPromoted =
    resolvedSearchParams.promoted === "1" && !!resolvedSearchParams.newGrade;

  const resultAnswers = attempt.answers.map((a) => ({
    word: a.word.word,
    meaning: a.word.meaning,
    correctOption: a.correctOption,
    selectedOption: a.selectedOption,
    isCorrect: a.isCorrect ?? false,
  }));

  return (
    <div className="container mx-auto max-w-lg space-y-4 p-4">
      {isPromoted ? (
        <PromotionNotification
          oldGradeId={attempt.gradeId}
          newGradeId={resolvedSearchParams.newGrade!}
        />
      ) : null}
      <QuizResult
        score={attempt.score ?? 0}
        totalQuestions={attempt.answers.length}
        scorePercentage={attempt.scorePercentage ?? 0}
        isPassed={attempt.isPassed ?? false}
        gradeId={attempt.gradeId}
      />
      <QuizResultDetail answers={resultAnswers} />
      <div className="text-center">
        <Button asChild>
          <Link href="/student/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>
    </div>
  );
}

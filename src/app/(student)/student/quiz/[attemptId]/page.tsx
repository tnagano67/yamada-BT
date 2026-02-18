import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { QuizSession } from "@/components/quiz/QuizSession";

interface QuizPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { attemptId } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        select: {
          id: true,
          wordId: true,
          allOptions: true,
          correctOption: true,
          selectedOption: true,
          word: {
            select: { word: true },
          },
        },
      },
    },
  });

  if (!attempt || attempt.studentId !== session.user.id) {
    notFound();
  }

  // 既に提出済みなら結果ページへ
  if (attempt.submittedAt) {
    redirect(`/student/quiz/${attemptId}/result`);
  }

  // クライアントに渡すデータを整形
  const answersForClient = attempt.answers.map((a) => ({
    id: a.id,
    wordId: a.wordId,
    word: a.word.word,
    allOptions: a.allOptions,
    correctOption: a.correctOption,
  }));

  return (
    <div className="container mx-auto p-4">
      <QuizSession attemptId={attemptId} answers={answersForClient} />
    </div>
  );
}

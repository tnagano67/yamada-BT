"use client";

import { useState, useCallback, useRef } from "react";
import { QuizCountdown } from "./QuizCountdown";
import { QuizProgress } from "./QuizProgress";
import { QuizQuestion } from "./QuizQuestion";
import { submitAnswer, completeQuiz } from "@/app/(student)/student/quiz/actions";
import { FEEDBACK_DISPLAY_MS } from "@/lib/quiz/constants";

type SessionState = "COUNTDOWN" | "IN_PROGRESS" | "FEEDBACK" | "SUBMITTING";

interface QuizAnswerData {
  id: string;
  wordId: string;
  word: string;
  allOptions: string[];
  correctOption: string;
}

interface QuizSessionProps {
  attemptId: string;
  answers: QuizAnswerData[];
}

export function QuizSession({ attemptId, answers }: QuizSessionProps) {
  const [state, setState] = useState<SessionState>("COUNTDOWN");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctOption: string;
    selectedOption: string;
  } | null>(null);
  const questionStartTime = useRef<number>(0);

  const currentAnswer = answers[currentIndex];
  const totalQuestions = answers.length;

  const handleCountdownComplete = useCallback(() => {
    setState("IN_PROGRESS");
    questionStartTime.current = Date.now();
  }, []);

  async function handleAnswer(selectedOption: string) {
    if (state !== "IN_PROGRESS" || !currentAnswer) return;

    setState("FEEDBACK");
    const timeSpentMs = Date.now() - questionStartTime.current;

    const result = await submitAnswer(
      attemptId,
      currentAnswer.id,
      selectedOption,
      timeSpentMs,
    );

    setFeedback({
      isCorrect: result.isCorrect,
      correctOption: result.correctOption,
      selectedOption,
    });

    // フィードバック表示後に次の問題へ
    setTimeout(() => {
      setFeedback(null);

      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex(currentIndex + 1);
        setState("IN_PROGRESS");
        questionStartTime.current = Date.now();
      } else {
        // 全問回答完了 → 採点
        setState("SUBMITTING");
        completeQuiz(attemptId);
      }
    }, FEEDBACK_DISPLAY_MS);
  }

  if (state === "COUNTDOWN") {
    return <QuizCountdown onComplete={handleCountdownComplete} />;
  }

  if (state === "SUBMITTING") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground">採点中...</p>
        </div>
      </div>
    );
  }

  if (!currentAnswer) return null;

  return (
    <div className="mx-auto max-w-lg">
      <QuizProgress current={currentIndex + 1} total={totalQuestions} />
      <QuizQuestion
        word={currentAnswer.word}
        options={currentAnswer.allOptions}
        onAnswer={handleAnswer}
        disabled={state === "FEEDBACK"}
        feedback={feedback}
      />
    </div>
  );
}

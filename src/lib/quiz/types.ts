import type { QuizMode, QuestionDirection } from "@/generated/prisma/client";

/** 問題生成用のWord情報 */
export interface QuizWord {
  id: string;
  wordNumber: number;
  word: string;
  meaning: string;
}

/** 生成された1問分のデータ */
export interface GeneratedQuestion {
  wordId: string;
  word: string;
  correctOption: string;
  options: string[];
  direction: QuestionDirection;
}

/** クイズ生成結果 */
export interface GeneratedQuiz {
  gradeId: string;
  mode: QuizMode;
  questions: GeneratedQuestion[];
}

/** クライアントに渡すQuizAnswer情報 */
export interface QuizAnswerForClient {
  id: string;
  wordId: string;
  word: string;
  questionDirection: QuestionDirection;
  correctOption: string;
  allOptions: string[];
  selectedOption: string | null;
  isCorrect: boolean | null;
}

/** 回答送信後のフィードバック */
export interface AnswerFeedback {
  isCorrect: boolean;
  correctOption: string;
}

/** 採点結果 */
export interface ScoreResult {
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  isPassed: boolean;
}

/** クイズ結果ページ用のデータ */
export interface QuizResultData {
  attemptId: string;
  gradeId: string;
  mode: QuizMode;
  score: number;
  scorePercentage: number;
  isPassed: boolean;
  startedAt: Date;
  submittedAt: Date;
  answers: QuizResultAnswer[];
}

/** 結果ページ用の回答データ */
export interface QuizResultAnswer {
  word: string;
  meaning: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
}

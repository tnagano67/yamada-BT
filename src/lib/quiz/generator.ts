import { prisma } from "@/lib/db/prisma";
import {
  QUIZ_QUESTION_COUNT,
  OPTIONS_COUNT,
  MIN_WORDS_FOR_QUIZ,
} from "./constants";
import type { QuizWord, GeneratedQuestion, GeneratedQuiz } from "./types";
import type { QuizMode } from "@/generated/prisma/client";

/**
 * Fisher-Yates シャッフル（配列を破壊的にシャッフル）
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * グレードIDから4択問題を自動生成する
 *
 * アルゴリズム:
 * 1. グレードのword範囲からDB検索
 * 2. Fisher-Yatesシャッフルで10問選出（不足時はpool全量）
 * 3. 各問題に誤答選択肢3つを同グレードからランダム選出
 * 4. 正解含む4択をシャッフル
 * 5. 最低4語必要（1正解+3誤答）、不足時はエラー
 */
export async function generateQuiz(
  gradeId: string,
  mode: QuizMode,
): Promise<GeneratedQuiz> {
  // グレードの全単語を取得
  const words = await prisma.word.findMany({
    where: { gradeId },
    select: { id: true, wordNumber: true, word: true, meaning: true },
  });

  if (words.length < MIN_WORDS_FOR_QUIZ) {
    throw new Error(
      `グレード ${gradeId} の単語数が不足しています（${words.length}語、最低${MIN_WORDS_FOR_QUIZ}語必要）`,
    );
  }

  // シャッフルして問題数分を選出
  const shuffled = fisherYatesShuffle([...words]);
  const selected = shuffled.slice(
    0,
    Math.min(QUIZ_QUESTION_COUNT, shuffled.length),
  );

  // 各問題について4択を生成
  const questions: GeneratedQuestion[] = selected.map((word) => {
    return generateQuestion(word, words);
  });

  return {
    gradeId,
    mode,
    questions,
  };
}

/**
 * 1問分の4択問題を生成する
 * Sprint 2 では en_to_ja（英語→日本語意味）のみ
 */
function generateQuestion(
  correctWord: QuizWord,
  wordPool: QuizWord[],
): GeneratedQuestion {
  // 誤答候補 = pool から正解を除外
  const distractorPool = wordPool.filter((w) => w.id !== correctWord.id);

  // Fisher-Yatesシャッフルで3つ選出
  const shuffledDistractors = fisherYatesShuffle([...distractorPool]);
  const distractors = shuffledDistractors.slice(0, OPTIONS_COUNT - 1);

  // 正解 + 誤答の選択肢をシャッフル
  const correctOption = correctWord.meaning;
  const options = fisherYatesShuffle([
    correctOption,
    ...distractors.map((d) => d.meaning),
  ]);

  return {
    wordId: correctWord.id,
    word: correctWord.word,
    correctOption,
    options,
    direction: "en_to_ja",
  };
}

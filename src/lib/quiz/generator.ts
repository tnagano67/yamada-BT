import { prisma } from "@/lib/db/prisma";
import {
  QUIZ_QUESTION_COUNT,
  OPTIONS_COUNT,
  MIN_WORDS_FOR_QUIZ,
  QUICK_MODE_WRONG_ANSWER_RATIO,
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
 * グレードIDに対応する単語を取得する
 *
 * - new_words: gradeIdで直接検索
 * - review/complete: reviewRangeStart..reviewRangeEnd の範囲で検索
 */
export async function fetchWordsForGrade(gradeId: string): Promise<QuizWord[]> {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: {
      subject: true,
      gradeType: true,
      reviewRangeStart: true,
      reviewRangeEnd: true,
    },
  });

  if (!grade) {
    throw new Error(`グレード ${gradeId} が見つかりません`);
  }

  if (grade.gradeType === "new_words") {
    return prisma.word.findMany({
      where: { gradeId },
      select: { id: true, wordNumber: true, word: true, meaning: true },
    });
  }

  // review / complete: 範囲指定で検索
  if (grade.reviewRangeStart == null || grade.reviewRangeEnd == null) {
    throw new Error(
      `グレード ${gradeId} の復習範囲が設定されていません`,
    );
  }

  return prisma.word.findMany({
    where: {
      subject: grade.subject,
      wordNumber: {
        gte: grade.reviewRangeStart,
        lte: grade.reviewRangeEnd,
      },
    },
    select: { id: true, wordNumber: true, word: true, meaning: true },
  });
}

/**
 * 層化サンプリング
 *
 * 復習グレード用。アイテムをバケットに分け、各バケットから均等に選出する。
 * バケット不足時は他バケットから補填する。
 *
 * @param items - サンプリング対象
 * @param count - 選出数
 * @param getBucket - アイテムからバケット番号を取得する関数
 */
export function stratifiedSample<T>(
  items: T[],
  count: number,
  getBucket: (item: T) => number,
): T[] {
  if (items.length <= count) {
    return fisherYatesShuffle([...items]);
  }

  // バケットにグルーピング
  const buckets = new Map<number, T[]>();
  for (const item of items) {
    const bucket = getBucket(item);
    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }
    buckets.get(bucket)!.push(item);
  }

  // 各バケットをシャッフル
  for (const [, bucket] of buckets) {
    fisherYatesShuffle(bucket);
  }

  const result: T[] = [];
  const bucketKeys = [...buckets.keys()].sort((a, b) => a - b);

  // ラウンドロビンで各バケットから均等に選出
  let round = 0;
  while (result.length < count) {
    let addedThisRound = false;
    for (const key of bucketKeys) {
      if (result.length >= count) break;
      const bucket = buckets.get(key)!;
      if (round < bucket.length) {
        result.push(bucket[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  return fisherYatesShuffle(result);
}

const WORDS_PER_BUCKET = 50;

/**
 * 生徒の過去の誤答wordIdを取得する（指定のグレード単語プール内）
 */
export async function fetchIncorrectWordIds(
  studentId: string,
  gradeWordIds: string[],
): Promise<string[]> {
  if (gradeWordIds.length === 0) return [];

  const incorrectAnswers = await prisma.quizAnswer.findMany({
    where: {
      attempt: { studentId },
      wordId: { in: gradeWordIds },
      isCorrect: false,
    },
    select: { wordId: true },
    distinct: ["wordId"],
  });

  return incorrectAnswers.map((a) => a.wordId);
}

/**
 * 誤答優先で問題を選出する（クイック練習モード用）
 *
 * 1. 誤答プールから MAX 3問選出
 * 2. 残りを通常プールからランダム選出
 * 3. 誤答がなければ通常動作にフォールバック
 */
export function selectWithWrongAnswerPriority(
  words: QuizWord[],
  incorrectWordIds: string[],
  totalCount: number,
): QuizWord[] {
  const maxWrongCount = Math.floor(totalCount * QUICK_MODE_WRONG_ANSWER_RATIO);

  const wrongWords = words.filter((w) => incorrectWordIds.includes(w.id));
  const normalWords = words.filter((w) => !incorrectWordIds.includes(w.id));

  // 誤答プールからシャッフル選出
  const shuffledWrong = fisherYatesShuffle([...wrongWords]);
  const selectedWrong = shuffledWrong.slice(
    0,
    Math.min(maxWrongCount, shuffledWrong.length),
  );

  // 残り枠を通常プールから
  const remaining = totalCount - selectedWrong.length;
  const shuffledNormal = fisherYatesShuffle([...normalWords]);
  const selectedNormal = shuffledNormal.slice(
    0,
    Math.min(remaining, shuffledNormal.length),
  );

  // 通常プールが不足時、誤答プールから追加
  const combined = [...selectedWrong, ...selectedNormal];
  if (combined.length < totalCount) {
    const additionalWrong = shuffledWrong
      .slice(selectedWrong.length)
      .slice(0, totalCount - combined.length);
    combined.push(...additionalWrong);
  }

  return fisherYatesShuffle(combined);
}

/**
 * グレードIDから4択問題を自動生成する
 *
 * アルゴリズム:
 * 1. グレードのword範囲からDB検索（復習グレードは範囲検索）
 * 2. クイック練習 + studentId指定時: 誤答優先出題
 *    新出語: Fisher-Yatesシャッフルで10問選出
 *    復習/完全制覇: 層化サンプリングで均等選出
 * 3. 各問題に誤答選択肢3つを同プールからランダム選出
 * 4. 正解含む4択をシャッフル
 * 5. 最低4語必要（1正解+3誤答）、不足時はエラー
 */
export async function generateQuiz(
  gradeId: string,
  mode: QuizMode,
  studentId?: string,
): Promise<GeneratedQuiz> {
  const [words, grade] = await Promise.all([
    fetchWordsForGrade(gradeId),
    prisma.grade.findUnique({
      where: { id: gradeId },
      select: { gradeType: true },
    }),
  ]);

  if (words.length < MIN_WORDS_FOR_QUIZ) {
    throw new Error(
      `グレード ${gradeId} の単語数が不足しています（${words.length}語、最低${MIN_WORDS_FOR_QUIZ}語必要）`,
    );
  }

  const questionCount = Math.min(QUIZ_QUESTION_COUNT, words.length);

  let selected: QuizWord[];

  // クイック練習モード + studentId指定時は誤答優先出題
  if (mode === "quick" && studentId) {
    const wordIds = words.map((w) => w.id);
    const incorrectWordIds = await fetchIncorrectWordIds(studentId, wordIds);

    if (incorrectWordIds.length > 0) {
      selected = selectWithWrongAnswerPriority(
        words,
        incorrectWordIds,
        questionCount,
      );
    } else {
      // 誤答なし: 通常フォールバック
      selected = fisherYatesShuffle([...words]).slice(0, questionCount);
    }
  } else if (grade && grade.gradeType !== "new_words") {
    // 復習/完全制覇グレードは層化サンプリング
    selected = stratifiedSample(
      words,
      questionCount,
      (w) => Math.floor((w.wordNumber - 1) / WORDS_PER_BUCKET),
    );
  } else {
    const shuffled = fisherYatesShuffle([...words]);
    selected = shuffled.slice(0, questionCount);
  }

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

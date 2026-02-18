import type { Subject } from "@/generated/prisma/client";
import type { ParsedGradeId, PromotionUpdateResult } from "./types";
import {
  CONSECUTIVE_PASSES_REQUIRED,
  MAX_ENGLISH_GRADE,
  MAX_JAPANESE_GRADE,
} from "./constants";

/**
 * グレードIDをパースする
 * E5 → { prefix: "E", number: 5, subject: "english" }
 * J20 → { prefix: "J", number: 20, subject: "japanese" }
 */
export function parseGradeId(gradeId: string): ParsedGradeId {
  const match = gradeId.match(/^([EJ])(\d+)$/);
  if (!match) {
    throw new Error(`不正なグレードID: ${gradeId}`);
  }

  const prefix = match[1];
  const number = parseInt(match[2], 10);
  const subject: Subject = prefix === "E" ? "english" : "japanese";

  return { prefix, number, subject };
}

/**
 * 次のグレードIDを取得する
 * 最大グレードの場合はnullを返す
 */
export function getNextGradeId(gradeId: string): string | null {
  const { prefix, number } = parseGradeId(gradeId);
  const max = prefix === "E" ? MAX_ENGLISH_GRADE : MAX_JAPANESE_GRADE;

  if (number >= max) return null;
  return `${prefix}${number + 1}`;
}

/**
 * 最大グレードかどうかを判定する
 */
export function isMaxGrade(gradeId: string): boolean {
  return getNextGradeId(gradeId) === null;
}

/**
 * 科目の初期グレードIDを取得する
 */
export function getInitialGradeId(subject: Subject): string {
  return subject === "english" ? "E1" : "J1";
}

/**
 * 昇格ロジックを計算する（純粋関数）
 *
 * - 合格: consecutivePasses + 1
 * - 3回連続合格 & 最大でなければ昇格
 * - 不合格: consecutivePasses を 0 にリセット
 * - 昇格後: consecutivePasses を 0 にリセット、newGradeId返却
 */
export function calculatePromotionUpdate(
  consecutivePasses: number,
  isPassed: boolean,
  currentGradeId: string,
): PromotionUpdateResult {
  if (!isPassed) {
    return {
      newConsecutivePasses: 0,
      shouldPromote: false,
      newGradeId: null,
    };
  }

  const newCount = consecutivePasses + 1;

  if (newCount >= CONSECUTIVE_PASSES_REQUIRED && !isMaxGrade(currentGradeId)) {
    return {
      newConsecutivePasses: 0,
      shouldPromote: true,
      newGradeId: getNextGradeId(currentGradeId),
    };
  }

  return {
    newConsecutivePasses: newCount,
    shouldPromote: false,
    newGradeId: null,
  };
}

import type { Subject, GradeType } from "@/generated/prisma/client";

/** グレードIDをパースした結果 */
export interface ParsedGradeId {
  prefix: string;
  number: number;
  subject: Subject;
}

/** 昇格計算の結果 */
export interface PromotionUpdateResult {
  newConsecutivePasses: number;
  shouldPromote: boolean;
  newGradeId: string | null;
}

/** グレード情報 */
export interface GradeInfo {
  id: string;
  subject: Subject;
  gradeNumber: number;
  gradeType: GradeType;
}

/** ダッシュボード表示用のグレード進捗データ */
export interface GradeProgressData {
  currentGradeId: string;
  subject: Subject;
  gradeType: GradeType;
  consecutivePasses: number;
  requiredPasses: number;
  isMaxGrade: boolean;
  promotedAt: Date | null;
}

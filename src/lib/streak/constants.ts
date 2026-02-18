import type { DayType } from "@/generated/prisma/client";

/** フリーズ初期値 */
export const FREEZE_INITIAL = 3;

/** フリーズ最大値 */
export const FREEZE_MAX = 5;

/** リバイバル初期値 */
export const REVIVAL_INITIAL = 2;

/** フリーズボーナスのマイルストーン（日数） */
export const FREEZE_BONUS_MILESTONE = 30;

/** フレームレベル閾値 */
export const FLAME_LEVEL_THRESHOLDS = [
  { level: 5, minDays: 100 },
  { level: 4, minDays: 60 },
  { level: 3, minDays: 30 },
  { level: 2, minDays: 7 },
  { level: 1, minDays: 1 },
] as const;

/** 自動スキップ対象のDayType */
export const AUTO_SKIP_DAY_TYPES: DayType[] = ["weekend", "holiday", "exam_period"];

/** 休暇のDayType */
export const VACATION_DAY_TYPES: DayType[] = ["vacation"];

import type { AlertSeverity } from "@/generated/prisma/client";

/** detectAlerts() に渡す生徒の状態 */
export interface AlertConditionInput {
  studentId: string;
  studentName: string;
  /** 直近の朝テスト受験日リスト (降順) */
  recentMorningTestDates: Date[];
  /** 直近の配信日リスト (降順, school_day のみ) */
  recentDeliveryDates: Date[];
  /** 週別正答率 (最新週が先頭、最大4週分) */
  weeklyAccuracies: number[];
  /** 学期目標の進捗率(%) (null = 目標未設定) */
  goalProgressPercent: number | null;
  /** 学期の進捗率(%) (0-100) */
  semesterProgressPercent: number;
  /** 前回のストリーク(途絶前の値)。null=ストリーク記録なし */
  previousStreak: number | null;
  /** 現在のストリーク */
  currentStreak: number;
  /** 直近の昇格テスト結果 (最新が先頭) */
  recentPromotionResults: boolean[];
  /** 最後の自学自習日 (quick/promotion) */
  lastSelfStudyDate: Date | null;
  /** 評価基準日 */
  evaluationDate: Date;
}

/** 検出されたアラート */
export interface DetectedAlert {
  alertType: string;
  severity: AlertSeverity;
  message: string;
  studentId: string;
}

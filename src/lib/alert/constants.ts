import type { AlertSeverity } from "@/generated/prisma/client";

/** アラート種別定義 */
export interface AlertTypeDefinition {
  alertType: string;
  severity: AlertSeverity;
  label: string;
  description: string;
}

export const ALERT_TYPES: AlertTypeDefinition[] = [
  {
    alertType: "consecutive_absence",
    severity: "high",
    label: "連続未受験",
    description: "3日以上連続で朝テスト未受験",
  },
  {
    alertType: "accuracy_declining",
    severity: "high",
    label: "正答率低下",
    description: "正答率が3週連続で低下",
  },
  {
    alertType: "goal_at_risk",
    severity: "high",
    label: "目標達成危険",
    description: "学期中間を過ぎて目標達成率20%未満",
  },
  {
    alertType: "streak_broken",
    severity: "medium",
    label: "ストリーク途絶",
    description: "7日以上のストリークが途絶えた",
  },
  {
    alertType: "promotion_stuck",
    severity: "medium",
    label: "昇格停滞",
    description: "昇格テスト3回連続不合格",
  },
  {
    alertType: "no_self_study",
    severity: "low",
    label: "自学習なし",
    description: "1週間自学自習（クイック/昇格）なし",
  },
];

/** 条件判定の閾値 */
export const ALERT_THRESHOLDS = {
  /** 連続未受験の日数 */
  CONSECUTIVE_ABSENCE_DAYS: 3,
  /** 正答率低下を判定する週数 */
  ACCURACY_DECLINING_WEEKS: 3,
  /** 目標達成危険の達成率閾値(%) */
  GOAL_AT_RISK_PERCENT: 20,
  /** ストリーク途絶の最小ストリーク日数 */
  STREAK_BROKEN_MIN_DAYS: 7,
  /** 昇格停滞の連続不合格回数 */
  PROMOTION_STUCK_FAILURES: 3,
  /** 自学習なしの日数 */
  NO_SELF_STUDY_DAYS: 7,
} as const;

/** severity の表示ラベル */
export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/** severity のソート順 (小さいほど優先) */
export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

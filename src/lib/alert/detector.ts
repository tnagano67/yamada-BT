import { ALERT_THRESHOLDS } from "./constants";
import type { AlertConditionInput, DetectedAlert } from "./types";

/**
 * 生徒の学習状態を評価し、該当するアラートを返す純粋関数
 */
export function detectAlerts(input: AlertConditionInput): DetectedAlert[] {
  const alerts: DetectedAlert[] = [];

  const consecutive = checkConsecutiveAbsence(input);
  if (consecutive) alerts.push(consecutive);

  const declining = checkAccuracyDeclining(input);
  if (declining) alerts.push(declining);

  const goalAtRisk = checkGoalAtRisk(input);
  if (goalAtRisk) alerts.push(goalAtRisk);

  const streakBroken = checkStreakBroken(input);
  if (streakBroken) alerts.push(streakBroken);

  const stuck = checkPromotionStuck(input);
  if (stuck) alerts.push(stuck);

  const noStudy = checkNoSelfStudy(input);
  if (noStudy) alerts.push(noStudy);

  return alerts;
}

/** 3日以上連続未受験 */
function checkConsecutiveAbsence(
  input: AlertConditionInput,
): DetectedAlert | null {
  const { recentDeliveryDates, recentMorningTestDates, evaluationDate } = input;

  // 直近の配信日から、受験していない連続日数をカウント
  const testDateSet = new Set(
    recentMorningTestDates.map((d) => d.getTime()),
  );

  let consecutiveAbsent = 0;
  for (const deliveryDate of recentDeliveryDates) {
    // 評価日より未来の配信は除外
    if (deliveryDate.getTime() > evaluationDate.getTime()) continue;
    if (!testDateSet.has(deliveryDate.getTime())) {
      consecutiveAbsent++;
    } else {
      break;
    }
  }

  if (consecutiveAbsent >= ALERT_THRESHOLDS.CONSECUTIVE_ABSENCE_DAYS) {
    return {
      alertType: "consecutive_absence",
      severity: "high",
      message: `${input.studentName}さんが${consecutiveAbsent}日連続で朝テスト未受験です`,
      studentId: input.studentId,
    };
  }
  return null;
}

/** 正答率が3週連続低下 */
function checkAccuracyDeclining(
  input: AlertConditionInput,
): DetectedAlert | null {
  const { weeklyAccuracies } = input;

  if (weeklyAccuracies.length < ALERT_THRESHOLDS.ACCURACY_DECLINING_WEEKS) {
    return null;
  }

  // weeklyAccuracies[0]が最新週。3週連続低下 = [0] < [1] < [2]
  let declining = true;
  for (
    let i = 0;
    i < ALERT_THRESHOLDS.ACCURACY_DECLINING_WEEKS - 1;
    i++
  ) {
    if (weeklyAccuracies[i] >= weeklyAccuracies[i + 1]) {
      declining = false;
      break;
    }
  }

  if (declining) {
    return {
      alertType: "accuracy_declining",
      severity: "high",
      message: `${input.studentName}さんの正答率が${ALERT_THRESHOLDS.ACCURACY_DECLINING_WEEKS}週連続で低下しています（${weeklyAccuracies.slice(0, 3).reverse().join("% → ")}%）`,
      studentId: input.studentId,
    };
  }
  return null;
}

/** 学期中間+目標達成率20%未満 */
function checkGoalAtRisk(input: AlertConditionInput): DetectedAlert | null {
  const { goalProgressPercent, semesterProgressPercent } = input;

  if (goalProgressPercent === null) return null;
  if (semesterProgressPercent < 50) return null;

  if (goalProgressPercent < ALERT_THRESHOLDS.GOAL_AT_RISK_PERCENT) {
    return {
      alertType: "goal_at_risk",
      severity: "high",
      message: `${input.studentName}さんの学期目標達成率が${goalProgressPercent}%で、達成が危ぶまれます`,
      studentId: input.studentId,
    };
  }
  return null;
}

/** ストリーク途絶 (7日以上あった場合) */
function checkStreakBroken(input: AlertConditionInput): DetectedAlert | null {
  const { previousStreak, currentStreak } = input;

  if (previousStreak === null) return null;
  if (
    previousStreak >= ALERT_THRESHOLDS.STREAK_BROKEN_MIN_DAYS &&
    currentStreak === 0
  ) {
    return {
      alertType: "streak_broken",
      severity: "medium",
      message: `${input.studentName}さんの${previousStreak}日間のストリークが途絶えました`,
      studentId: input.studentId,
    };
  }
  return null;
}

/** 昇格テスト3回連続不合格 */
function checkPromotionStuck(input: AlertConditionInput): DetectedAlert | null {
  const { recentPromotionResults } = input;

  if (
    recentPromotionResults.length < ALERT_THRESHOLDS.PROMOTION_STUCK_FAILURES
  ) {
    return null;
  }

  const recentFailures = recentPromotionResults.slice(
    0,
    ALERT_THRESHOLDS.PROMOTION_STUCK_FAILURES,
  );
  const allFailed = recentFailures.every((r) => !r);

  if (allFailed) {
    return {
      alertType: "promotion_stuck",
      severity: "medium",
      message: `${input.studentName}さんが昇格テストに${ALERT_THRESHOLDS.PROMOTION_STUCK_FAILURES}回連続で不合格です`,
      studentId: input.studentId,
    };
  }
  return null;
}

/** 1週間自学自習なし */
function checkNoSelfStudy(input: AlertConditionInput): DetectedAlert | null {
  const { lastSelfStudyDate, evaluationDate } = input;

  if (!lastSelfStudyDate) {
    return {
      alertType: "no_self_study",
      severity: "low",
      message: `${input.studentName}さんが自学自習（クイック練習・昇格チャレンジ）を行っていません`,
      studentId: input.studentId,
    };
  }

  const diffMs = evaluationDate.getTime() - lastSelfStudyDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= ALERT_THRESHOLDS.NO_SELF_STUDY_DAYS) {
    return {
      alertType: "no_self_study",
      severity: "low",
      message: `${input.studentName}さんが${Math.floor(diffDays)}日間自学自習を行っていません`,
      studentId: input.studentId,
    };
  }
  return null;
}

import { prisma } from "@/lib/db/prisma";
import { isDateSuspended } from "./schedule-service";

/**
 * 翌日の配信を生成する
 *
 * 1. 翌日の曜日に対応するスケジュールを取得
 * 2. 休止期間かチェック
 * 3. 重複チェック（@@unique([date, subject])）
 * 4. QuizDelivery を scheduled で作成
 */
export async function generateDeliveriesForDate(
  targetDate: Date,
): Promise<{ created: number; skipped: number }> {
  const dayOfWeek = targetDate.getUTCDay();
  let created = 0;
  let skipped = 0;

  // 対象日の曜日に対応するアクティブなスケジュールを取得
  const schedules = await prisma.quizSchedule.findMany({
    where: {
      dayOfWeek,
      isActive: true,
    },
  });

  for (const schedule of schedules) {
    // 休止期間チェック
    const suspended = await isDateSuspended(targetDate, schedule.subject);
    if (suspended) {
      skipped++;
      continue;
    }

    // 重複チェック
    const existing = await prisma.quizDelivery.findUnique({
      where: {
        date_subject: {
          date: targetDate,
          subject: schedule.subject,
        },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // 配信時刻を計算（JST → UTC変換: JST時刻から9時間引く）
    const [hours, minutes] = schedule.deliveryTime.split(":").map(Number);
    const deliveryTime = new Date(targetDate);
    deliveryTime.setUTCHours(hours - 9, minutes, 0, 0);

    const deadlineTime = new Date(deliveryTime);
    deadlineTime.setUTCMinutes(
      deadlineTime.getUTCMinutes() + schedule.deadlineMinutes,
    );

    await prisma.quizDelivery.create({
      data: {
        date: targetDate,
        subject: schedule.subject,
        deliveryTime,
        deadlineTime,
        status: "scheduled",
      },
    });

    created++;
  }

  return { created, skipped };
}

/**
 * scheduled → active に変更する
 *
 * 現在時刻を過ぎた配信をアクティブ化する
 */
export async function activateDeliveries(): Promise<number> {
  const now = new Date();

  const result = await prisma.quizDelivery.updateMany({
    where: {
      status: "scheduled",
      deliveryTime: { lte: now },
    },
    data: {
      status: "active",
    },
  });

  return result.count;
}

/**
 * active → closed に変更する
 *
 * 締切時刻を過ぎた配信をクローズする
 */
export async function closeDeliveries(): Promise<number> {
  const now = new Date();

  const result = await prisma.quizDelivery.updateMany({
    where: {
      status: "active",
      deadlineTime: { lte: now },
    },
    data: {
      status: "closed",
    },
  });

  return result.count;
}

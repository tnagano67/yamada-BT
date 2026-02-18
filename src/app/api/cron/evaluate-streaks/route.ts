import { NextResponse } from "next/server";
import { todayJST, formatDate } from "@/lib/date-utils";
import { processDailyStreaksForDate } from "@/lib/streak/streak-service";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 毎晩22:05 JST (13:05 UTC) に実行
 * 当日の全生徒のストリークを評価する
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayJST();

    const result = await processDailyStreaksForDate(today);

    return NextResponse.json({
      success: true,
      date: formatDate(today),
      ...result,
    });
  } catch (error) {
    console.error("Failed to evaluate streaks:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

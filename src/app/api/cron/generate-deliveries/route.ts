import { NextResponse } from "next/server";
import { tomorrowJST, formatDate } from "@/lib/date-utils";
import { generateDeliveriesForDate } from "@/lib/schedule/delivery-generator";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 毎晩22:00 JST (13:00 UTC) に実行
 * 翌日の配信を生成する
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 翌日の日付を計算（JST基準）
    const tomorrow = tomorrowJST();

    const result = await generateDeliveriesForDate(tomorrow);

    return NextResponse.json({
      success: true,
      date: formatDate(tomorrow),
      ...result,
    });
  } catch (error) {
    console.error("Failed to generate deliveries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

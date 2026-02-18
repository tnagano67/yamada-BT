import { NextResponse } from "next/server";
import { closeDeliveries } from "@/lib/schedule/delivery-generator";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 毎朝8:30 JST (23:30 UTC前日) に実行
 * active → closed にステータス変更
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const closed = await closeDeliveries();

    return NextResponse.json({
      success: true,
      closed,
    });
  } catch (error) {
    console.error("Failed to close deliveries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

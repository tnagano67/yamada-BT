import { NextResponse } from "next/server";
import { activateDeliveries } from "@/lib/schedule/delivery-generator";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 毎朝8:15 JST (23:15 UTC前日) に実行
 * scheduled → active にステータス変更
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activated = await activateDeliveries();

    return NextResponse.json({
      success: true,
      activated,
    });
  } catch (error) {
    console.error("Failed to activate deliveries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

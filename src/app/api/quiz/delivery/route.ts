import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { hasRole } from "@/lib/auth/roles";
import { NextResponse } from "next/server";
import type { QuizDeliveryStatus } from "@/generated/prisma/client";

/**
 * POST /api/quiz/delivery
 * 朝テスト配信を作成（教員以上のみ）
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "teacher")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { date, subject, deliveryTime, deadlineTime } = body;

  if (!date || !subject || !deliveryTime || !deadlineTime) {
    return NextResponse.json(
      { error: "必須パラメータが不足しています" },
      { status: 400 },
    );
  }

  const delivery = await prisma.quizDelivery.create({
    data: {
      date: new Date(date),
      subject,
      deliveryTime: new Date(deliveryTime),
      deadlineTime: new Date(deadlineTime),
      status: "scheduled",
    },
  });

  return NextResponse.json(delivery, { status: 201 });
}

/**
 * PATCH /api/quiz/delivery
 * 配信ステータスを変更（教員以上のみ）
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "teacher")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body as { id: string; status: QuizDeliveryStatus };

  if (!id || !status) {
    return NextResponse.json(
      { error: "必須パラメータが不足しています" },
      { status: 400 },
    );
  }

  const validStatuses: QuizDeliveryStatus[] = [
    "scheduled",
    "active",
    "closed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "無効なステータスです" },
      { status: 400 },
    );
  }

  const delivery = await prisma.quizDelivery.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(delivery);
}

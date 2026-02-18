"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { AlertSeverity } from "@/generated/prisma/client";

interface AlertItem {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  student: {
    id: string;
    name: string | null;
    nameKana: string | null;
  };
}

interface AlertListProps {
  alerts: AlertItem[];
  acknowledgeAction: (alertId: string) => Promise<void>;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-yellow-500",
  low: "border-l-4 border-l-blue-500",
};

const SEVERITY_BADGE: Record<AlertSeverity, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function AlertList({ alerts, acknowledgeAction }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        未確認のアラートはありません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          acknowledgeAction={acknowledgeAction}
        />
      ))}
    </div>
  );
}

function AlertCard({
  alert,
  acknowledgeAction,
}: {
  alert: AlertItem;
  acknowledgeAction: (alertId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleAcknowledge() {
    startTransition(async () => {
      await acknowledgeAction(alert.id);
    });
  }

  return (
    <Card className={SEVERITY_STYLES[alert.severity]}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={SEVERITY_BADGE[alert.severity]}>
              {SEVERITY_LABELS[alert.severity]}
            </Badge>
            <Link
              href={`/teacher/students/${alert.student.id}`}
              className="text-primary text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              {alert.student.name ?? "名前未設定"}
            </Link>
          </div>
          <span className="text-muted-foreground text-xs">
            {new Date(alert.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-normal">{alert.message}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAcknowledge}
            disabled={isPending}
          >
            {isPending ? "処理中..." : "確認済み"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

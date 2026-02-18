import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TodaySummaryCardProps {
  date: Date;
  hasActiveDelivery: boolean;
  deliveryStatus: string | null;
  totalTested: number;
  totalStudents: number;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "配信予定",
  active: "配信中",
  closed: "終了",
  cancelled: "中止",
};

export function TodaySummaryCard({
  date,
  hasActiveDelivery,
  deliveryStatus,
  totalTested,
  totalStudents,
}: TodaySummaryCardProps) {
  const dateStr = date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>本日のテスト</CardTitle>
            <CardDescription>{dateStr}</CardDescription>
          </div>
          {hasActiveDelivery && deliveryStatus ? (
            <Badge
              variant={deliveryStatus === "active" ? "default" : "secondary"}
            >
              {STATUS_LABELS[deliveryStatus] ?? deliveryStatus}
            </Badge>
          ) : (
            <Badge variant="outline">配信なし</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasActiveDelivery ? (
          <p className="text-lg">
            <span className="text-2xl font-bold">{totalTested}</span>
            <span className="text-muted-foreground"> / {totalStudents} 名受験</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">本日の配信はありません</p>
        )}
      </CardContent>
    </Card>
  );
}

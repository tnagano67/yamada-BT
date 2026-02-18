import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AlertSummaryCardProps {
  high: number;
  medium: number;
  low: number;
}

export function AlertSummaryCard({ high, medium, low }: AlertSummaryCardProps) {
  const total = high + medium + low;

  return (
    <Card>
      <CardHeader>
        <CardTitle>アラート</CardTitle>
        <CardDescription>要対応の生徒</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground text-sm">
            未確認のアラートはありません
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {high > 0 ? (
                <Badge variant="destructive">{high} 高</Badge>
              ) : null}
              {medium > 0 ? (
                <Badge variant="secondary">{medium} 中</Badge>
              ) : null}
              {low > 0 ? (
                <Badge variant="outline">{low} 低</Badge>
              ) : null}
            </div>
            <Link
              href="/teacher/alerts"
              className="text-primary text-sm underline underline-offset-4 hover:no-underline"
            >
              アラート一覧を確認
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

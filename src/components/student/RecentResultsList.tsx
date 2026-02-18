import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentResult {
  id: string;
  mode: string;
  gradeId: string;
  scorePercentage: number | null;
  isPassed: boolean | null;
  submittedAt: Date | null;
}

interface RecentResultsListProps {
  results: RecentResult[];
}

const MODE_LABELS: Record<string, string> = {
  morning_test: "朝テスト",
  promotion: "昇格チャレンジ",
  quick: "クイック練習",
  weakness: "苦手克服",
};

export function RecentResultsList({ results }: RecentResultsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近のテスト結果</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            テスト結果がありません
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {MODE_LABELS[r.mode] ?? r.mode}
                  </Badge>
                  <span className="font-mono text-sm">{r.gradeId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {r.scorePercentage !== null ? `${r.scorePercentage}%` : "—"}
                  </span>
                  {r.isPassed !== null ? (
                    r.isPassed ? (
                      <Badge variant="default">合格</Badge>
                    ) : (
                      <Badge variant="secondary">不合格</Badge>
                    )
                  ) : null}
                  <span className="text-muted-foreground text-xs">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleDateString("ja-JP")
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

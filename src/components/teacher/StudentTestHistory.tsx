import { Badge } from "@/components/ui/badge";

interface TestHistoryItem {
  id: string;
  mode: string;
  gradeId: string;
  scorePercentage: number | null;
  isPassed: boolean | null;
  submittedAt: Date | null;
}

interface StudentTestHistoryProps {
  attempts: TestHistoryItem[];
}

const MODE_LABELS: Record<string, string> = {
  morning_test: "朝テスト",
  promotion: "昇格チャレンジ",
  quick: "クイック練習",
  weakness: "苦手克服",
};

export function StudentTestHistory({ attempts }: StudentTestHistoryProps) {
  if (attempts.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        テスト履歴がありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-medium">日時</th>
            <th className="px-4 py-2 text-left font-medium">モード</th>
            <th className="px-4 py-2 text-center font-medium">グレード</th>
            <th className="px-4 py-2 text-right font-medium">正答率</th>
            <th className="px-4 py-2 text-center font-medium">合否</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-2">
                {a.submittedAt
                  ? new Date(a.submittedAt).toLocaleDateString("ja-JP")
                  : "—"}
              </td>
              <td className="px-4 py-2">
                <Badge variant="outline">
                  {MODE_LABELS[a.mode] ?? a.mode}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center font-mono">{a.gradeId}</td>
              <td className="px-4 py-2 text-right">
                {a.scorePercentage !== null ? `${a.scorePercentage}%` : "—"}
              </td>
              <td className="px-4 py-2 text-center">
                {a.isPassed !== null ? (
                  a.isPassed ? (
                    <span className="text-green-600 dark:text-green-400">
                      合格
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      不合格
                    </span>
                  )
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

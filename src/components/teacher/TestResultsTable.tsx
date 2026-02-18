import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ClassTestResultItem } from "@/lib/teacher/class-detail-service";

interface TestResultsTableProps {
  results: ClassTestResultItem[];
}

export function TestResultsTable({ results }: TestResultsTableProps) {
  if (results.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">生徒がいません</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-medium">番号</th>
            <th className="px-4 py-2 text-left font-medium">氏名</th>
            <th className="px-4 py-2 text-center font-medium">状態</th>
            <th className="px-4 py-2 text-right font-medium">正答率</th>
            <th className="px-4 py-2 text-center font-medium">合否</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.studentId} className="border-b hover:bg-muted/50">
              <td className="px-4 py-2">{r.studentNumber}</td>
              <td className="px-4 py-2">
                <Link
                  href={`/teacher/students/${r.studentId}`}
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  {r.name ?? "名前未設定"}
                </Link>
              </td>
              <td className="px-4 py-2 text-center">
                {r.submittedAt ? (
                  <Badge variant="secondary">受験済み</Badge>
                ) : (
                  <Badge variant="outline">未受験</Badge>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {r.scorePercentage !== null ? `${r.scorePercentage}%` : "—"}
              </td>
              <td className="px-4 py-2 text-center">
                {r.isPassed !== null ? (
                  r.isPassed ? (
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

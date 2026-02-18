import Link from "next/link";
import type { ClassDailySummary } from "@/lib/teacher/dashboard-service";

interface ClassSummaryTableProps {
  classes: ClassDailySummary[];
}

export function ClassSummaryTable({ classes }: ClassSummaryTableProps) {
  if (classes.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        担当クラスがありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-medium">クラス</th>
            <th className="px-4 py-2 text-right font-medium">生徒数</th>
            <th className="px-4 py-2 text-right font-medium">受験者</th>
            <th className="px-4 py-2 text-right font-medium">受験率</th>
            <th className="px-4 py-2 text-right font-medium">平均正答率</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr key={cls.classId} className="border-b hover:bg-muted/50">
              <td className="px-4 py-2">
                <Link
                  href={`/teacher/classes/${cls.classId}`}
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  {cls.className}
                </Link>
              </td>
              <td className="px-4 py-2 text-right">{cls.totalStudents}</td>
              <td className="px-4 py-2 text-right">{cls.testedCount}</td>
              <td className="px-4 py-2 text-right">{cls.attendanceRate}%</td>
              <td className="px-4 py-2 text-right">
                {cls.averageScore !== null ? `${cls.averageScore}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

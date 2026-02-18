import Link from "next/link";
import type { ClassStudentItem } from "@/lib/teacher/class-detail-service";

interface StudentListTableProps {
  students: ClassStudentItem[];
}

export function StudentListTable({ students }: StudentListTableProps) {
  if (students.length === 0) {
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
            <th className="px-4 py-2 text-left font-medium">ふりがな</th>
            <th className="px-4 py-2 text-center font-medium">英語</th>
            <th className="px-4 py-2 text-center font-medium">日本語</th>
            <th className="px-4 py-2 text-right font-medium">ストリーク</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.studentId} className="border-b hover:bg-muted/50">
              <td className="px-4 py-2">{s.studentNumber}</td>
              <td className="px-4 py-2">
                <Link
                  href={`/teacher/students/${s.studentId}`}
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  {s.name ?? "名前未設定"}
                </Link>
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {s.nameKana ?? "—"}
              </td>
              <td className="px-4 py-2 text-center">
                {s.englishGrade ?? "—"}
              </td>
              <td className="px-4 py-2 text-center">
                {s.japaneseGrade ?? "—"}
              </td>
              <td className="px-4 py-2 text-right">
                {s.currentStreak > 0 ? `${s.currentStreak}日` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

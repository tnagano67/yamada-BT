"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateStudentStatusAction } from "@/app/(admin)/admin/classes/actions";

interface StudentItem {
  id: string;
  studentNumber: number;
  status: string;
  student: {
    id: string;
    name: string | null;
    nameKana: string | null;
    email: string | null;
  };
}

interface StudentListProps {
  students: StudentItem[];
}

const STATUS_LABELS: Record<string, string> = {
  active: "在籍",
  transferred: "転籍",
  suspended: "休学",
  graduated: "卒業",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  transferred: "outline",
  suspended: "destructive",
  graduated: "secondary",
};

export function StudentList({ students }: StudentListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            このクラスにはまだ生徒が登録されていません
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleStatusChange(classStudentId: string, status: string) {
    setUpdatingId(classStudentId);
    try {
      const formData = new FormData();
      formData.set("classStudentId", classStudentId);
      formData.set("status", status);
      await updateStudentStatusAction(formData);
    } finally {
      setUpdatingId(null);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>生徒一覧（{students.length}名）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">出席番号</th>
                <th className="px-4 py-2 text-left font-medium">氏名</th>
                <th className="px-4 py-2 text-left font-medium">氏名カナ</th>
                <th className="px-4 py-2 text-left font-medium">メール</th>
                <th className="px-4 py-2 text-left font-medium">ステータス</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{s.studentNumber}</td>
                  <td className="px-4 py-2">{s.student.name ?? "-"}</td>
                  <td className="px-4 py-2">{s.student.nameKana ?? "-"}</td>
                  <td className="px-4 py-2 text-xs">
                    {s.student.email ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANTS[s.status] ?? "outline"}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                        value={s.status}
                        disabled={updatingId === s.id}
                        onChange={(e) =>
                          handleStatusChange(s.id, e.target.value)
                        }
                      >
                        <option value="active">在籍</option>
                        <option value="suspended">休学</option>
                        <option value="graduated">卒業</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

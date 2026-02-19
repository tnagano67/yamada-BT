"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateStudentStatusAction,
  removeStudentFromClassAction,
} from "@/app/(admin)/admin/classes/actions";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/admin/SortableHeader";

interface StudentGrade {
  subject: string;
  currentGradeId: string;
}

interface StudentItem {
  id: string;
  studentNumber: number;
  status: string;
  student: {
    id: string;
    name: string | null;
    nameKana: string | null;
    email: string | null;
    studentGrades: StudentGrade[];
  };
}

interface StudentListProps {
  students: StudentItem[];
  classId: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "在籍",
  transferred: "転籍",
  suspended: "休学",
  graduated: "卒業",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  transferred: "outline",
  suspended: "destructive",
  graduated: "secondary",
};

function getGrade(grades: StudentGrade[], subject: string): string {
  const grade = grades.find((g) => g.subject === subject);
  return grade ? grade.currentGradeId : "-";
}

export function StudentList({ students, classId }: StudentListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isPending, startTransition] = useTransition();

  const sortedStudents = useMemo(() => {
    if (!sortKey || !sortDirection) return students;

    return [...students].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "studentNumber") {
        cmp = a.studentNumber - b.studentNumber;
      } else if (sortKey === "name") {
        const aName = a.student.name ?? "";
        const bName = b.student.name ?? "";
        cmp = aName.localeCompare(bName, "ja");
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [students, sortKey, sortDirection]);

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(key);
    setSortDirection(direction);
  }

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
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ステータスの更新に失敗しました"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(classStudentId: string) {
    setRemovingId(classStudentId);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("classStudentId", classStudentId);
        formData.set("classId", classId);
        await removeStudentFromClassAction(formData);
        toast.success("生徒をクラスから除外しました");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "除外に失敗しました"
        );
      } finally {
        setRemovingId(null);
      }
    });
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
                <th className="px-4 py-2 text-left">
                  <SortableHeader
                    label="出席番号"
                    sortKey="studentNumber"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2 text-left">
                  <SortableHeader
                    label="氏名"
                    sortKey="name"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2 text-left font-medium">氏名カナ</th>
                <th className="px-4 py-2 text-left font-medium">メール</th>
                <th className="px-4 py-2 text-left font-medium">英語</th>
                <th className="px-4 py-2 text-left font-medium">日本語</th>
                <th className="px-4 py-2 text-left font-medium">ステータス</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{s.studentNumber}</td>
                  <td className="px-4 py-2">{s.student.name ?? "-"}</td>
                  <td className="px-4 py-2">{s.student.nameKana ?? "-"}</td>
                  <td className="px-4 py-2 text-xs">
                    {s.student.email ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">
                      {getGrade(s.student.studentGrades, "english")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">
                      {getGrade(s.student.studentGrades, "japanese")}
                    </Badge>
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
                      <DeleteConfirmDialog
                        title="生徒をクラスから除外"
                        description={`${s.student.name ?? "この生徒"}をクラスから除外しますか？ユーザーアカウントは削除されません。`}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        onConfirm={() => handleRemove(s.id)}
                        isPending={isPending && removingId === s.id}
                      />
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

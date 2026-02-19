"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { deleteStudentAction } from "@/app/(admin)/admin/students/actions";
import { EditStudentDialog } from "./EditStudentDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableHeader, type SortDirection } from "./SortableHeader";
import { PaginationBar } from "./PaginationBar";
import type { PaginationMeta } from "@/lib/admin/pagination";
import { generateCsv, downloadCsv } from "@/lib/admin/csv-export";

interface ClassInfo {
  gradeYear: number;
  className: string;
}

interface ClassStudentInfo {
  studentNumber: number;
  status: string;
  class: ClassInfo;
}

interface GradeInfo {
  subject: string;
  currentGradeId: string;
}

interface StudentItem {
  id: string;
  name: string | null;
  nameKana: string | null;
  email: string | null;
  classStudents: ClassStudentInfo[];
  studentGrades: GradeInfo[];
}

interface AdminStudentListProps {
  students: StudentItem[];
  gradeYears: number[];
  classNames: string[];
  paginationMeta: PaginationMeta;
  filters: {
    gradeYear: string;
    className: string;
    status: string;
    unassigned: string;
    search: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  active: "在籍",
  transferred: "転籍",
  suspended: "休学",
  graduated: "卒業",
};

function getGradeForSubject(
  grades: GradeInfo[],
  subject: string,
): string {
  const grade = grades.find((g) => g.subject === subject);
  return grade ? grade.currentGradeId : "-";
}

export function AdminStudentList({
  students,
  gradeYears,
  classNames,
  paginationMeta,
  filters,
}: AdminStudentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return students;

    return [...students].sort((a, b) => {
      const aCs = a.classStudents[0];
      const bCs = b.classStudents[0];
      let cmp = 0;

      switch (sortKey) {
        case "name":
          cmp = (a.name ?? "").localeCompare(b.name ?? "");
          break;
        case "gradeYear":
          cmp =
            (aCs?.class.gradeYear ?? Infinity) -
            (bCs?.class.gradeYear ?? Infinity);
          break;
        case "className":
          cmp = (aCs?.class.className ?? "").localeCompare(
            bCs?.class.className ?? "",
          );
          break;
        case "studentNumber":
          cmp =
            (aCs?.studentNumber ?? Infinity) -
            (bCs?.studentNumber ?? Infinity);
          break;
      }

      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [students, sortKey, sortDirection]);

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(direction ? key : null);
    setSortDirection(direction);
  }

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      await deleteStudentAction(formData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    const headers = [
      "学年",
      "組",
      "出席番号",
      "氏名",
      "メール",
      "英語グレード",
      "日本語グレード",
      "ステータス",
    ];
    const rows = sorted.map((s) => {
      const cs = s.classStudents[0];
      return [
        cs ? String(cs.class.gradeYear) : "",
        cs ? cs.class.className : "",
        cs ? String(cs.studentNumber) : "",
        s.name ?? "",
        s.email ?? "",
        getGradeForSubject(s.studentGrades, "english"),
        getGradeForSubject(s.studentGrades, "japanese"),
        cs ? STATUS_LABELS[cs.status] ?? cs.status : "",
      ];
    });
    const csv = generateCsv(headers, rows);
    downloadCsv("students.csv", csv);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-medium">学年</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={filters.gradeYear}
                onChange={(e) =>
                  updateSearchParams({
                    gradeYear: e.target.value,
                    unassigned: "",
                  })
                }
              >
                <option value="">すべて</option>
                {gradeYears.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">組</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={filters.className}
                onChange={(e) =>
                  updateSearchParams({
                    className: e.target.value,
                    unassigned: "",
                  })
                }
              >
                <option value="">すべて</option>
                {classNames.map((c) => (
                  <option key={c} value={c}>
                    {c}組
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">ステータス</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={filters.status}
                onChange={(e) =>
                  updateSearchParams({
                    status: e.target.value,
                    unassigned: "",
                  })
                }
              >
                <option value="">すべて</option>
                <option value="active">在籍</option>
                <option value="transferred">転籍</option>
                <option value="suspended">休学</option>
                <option value="graduated">卒業</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">氏名・メール検索</label>
              <Input
                className="h-8 w-48 text-sm"
                placeholder="検索..."
                defaultValue={filters.search}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateSearchParams({
                      search: (e.target as HTMLInputElement).value,
                    });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value !== filters.search) {
                    updateSearchParams({ search: e.target.value });
                  }
                }}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">&nbsp;</label>
              <label className="flex h-8 items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={filters.unassigned === "true"}
                  onChange={(e) =>
                    updateSearchParams({
                      unassigned: e.target.checked ? "true" : "",
                      gradeYear: "",
                      className: "",
                      status: "",
                    })
                  }
                />
                クラス未所属のみ
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              生徒一覧（{paginationMeta.totalCount}名）
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-1 h-4 w-4" />
              CSV出力
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {paginationMeta.totalCount === 0
                ? "生徒が登録されていません"
                : "該当する生徒がいません"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="年"
                        sortKey="gradeYear"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="組"
                        sortKey="className"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="番"
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
                    <th className="px-4 py-2 text-left font-medium">
                      メールアドレス
                    </th>
                    <th className="px-4 py-2 text-left font-medium">英語</th>
                    <th className="px-4 py-2 text-left font-medium">日本語</th>
                    <th className="px-4 py-2 text-left font-medium">
                      ステータス
                    </th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const cs = s.classStudents[0];
                    return (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {cs ? cs.class.gradeYear : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {cs ? cs.class.className : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {cs ? cs.studentNumber : "-"}
                        </td>
                        <td className="px-4 py-2">{s.name ?? "-"}</td>
                        <td className="px-4 py-2 text-xs">
                          {s.email ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {getGradeForSubject(s.studentGrades, "english")}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {getGradeForSubject(s.studentGrades, "japanese")}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {cs
                            ? STATUS_LABELS[cs.status] ?? cs.status
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <EditStudentDialog student={s} />
                            <DeleteConfirmDialog
                              title="生徒の削除"
                              description={`${s.name ?? "この生徒"}を削除しますか？この操作は取り消せません。`}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deletingId === s.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                              onConfirm={() => handleDelete(s.id)}
                              isPending={deletingId === s.id}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationBar meta={paginationMeta} />
    </div>
  );
}

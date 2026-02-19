"use client";

import Link from "next/link";
import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, ExternalLink, Pencil, Download } from "lucide-react";
import { toast } from "sonner";
import {
  deleteClassAction,
  updateClassAction,
} from "@/app/(admin)/admin/classes/actions";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { SortableHeader, type SortDirection } from "@/components/admin/SortableHeader";
import { PaginationBar } from "@/components/admin/PaginationBar";
import type { PaginationMeta } from "@/lib/admin/pagination";
import { generateCsv, downloadCsv } from "@/lib/admin/csv-export";

interface ClassItem {
  id: string;
  gradeYear: number;
  className: string;
  homeroomTeacher: { id: string; name: string | null } | null;
  _count: { classStudents: number };
}

interface TeacherOption {
  id: string;
  name: string | null;
}

interface ClassListProps {
  classes: ClassItem[];
  academicYear: number;
  teachers: TeacherOption[];
  paginationMeta: PaginationMeta;
  filters: { gradeYear: string; search: string };
}

interface EditState {
  id: string;
  gradeYear: number;
  className: string;
  homeroomTeacherId: string;
}

export function ClassList({
  classes,
  academicYear,
  teachers,
  paginationMeta,
  filters,
}: ClassListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<EditState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

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
    [searchParams, pathname, router],
  );

  function handleGradeYearChange(value: string) {
    updateSearchParams({ gradeYear: value });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateSearchParams({ search: searchInput });
  }

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(key);
    setSortDirection(direction);
  }

  const sortedClasses = useMemo(() => {
    if (!sortKey || !sortDirection) return classes;
    return [...classes].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortKey) {
        case "gradeYear":
          aVal = a.gradeYear;
          bVal = b.gradeYear;
          break;
        case "className":
          aVal = a.className;
          bVal = b.className;
          break;
        case "studentCount":
          aVal = a._count.classStudents;
          bVal = b._count.classStudents;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [classes, sortKey, sortDirection]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const formData = new FormData();
      formData.set("id", id);
      await deleteClassAction(formData);
      toast.success("クラスを削除しました");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "クラスの削除に失敗しました",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(cls: ClassItem) {
    setEditDialog({
      id: cls.id,
      gradeYear: cls.gradeYear,
      className: cls.className,
      homeroomTeacherId: cls.homeroomTeacher?.id ?? "",
    });
  }

  function handleSave() {
    if (!editDialog) return;

    const formData = new FormData();
    formData.set("id", editDialog.id);
    formData.set("gradeYear", String(editDialog.gradeYear));
    formData.set("className", editDialog.className);
    formData.set("homeroomTeacherId", editDialog.homeroomTeacherId);

    startTransition(async () => {
      try {
        await updateClassAction(formData);
        toast.success("クラスを更新しました");
        setEditDialog(null);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "クラスの更新に失敗しました",
        );
      }
    });
  }

  function handleCsvExport() {
    const headers = ["学年", "組", "担任", "生徒数"];
    const rows = sortedClasses.map((cls) => [
      `${cls.gradeYear}年`,
      cls.className,
      cls.homeroomTeacher?.name ?? "未設定",
      String(cls._count.classStudents),
    ]);
    const csvContent = generateCsv(headers, rows);
    downloadCsv(`クラス一覧_${academicYear}年度.csv`, csvContent);
  }

  return (
    <>
      {/* Filter card */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="filter-gradeYear">学年</Label>
              <select
                id="filter-gradeYear"
                className="border-input bg-background flex h-9 w-full min-w-[120px] rounded-md border px-3 py-1 text-sm"
                value={filters.gradeYear}
                onChange={(e) => handleGradeYearChange(e.target.value)}
              >
                <option value="">すべて</option>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
              </select>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex items-end gap-2">
              <div className="grid gap-2">
                <Label htmlFor="filter-search">検索</Label>
                <Input
                  id="filter-search"
                  placeholder="組名・担任名で検索"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="min-w-[200px]"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="h-9">
                検索
              </Button>
            </form>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleCsvExport}
                disabled={sortedClasses.length === 0}
              >
                <Download className="mr-1 h-3 w-3" />
                CSV出力
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class list */}
      {sortedClasses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {filters.gradeYear || filters.search
                ? "条件に一致するクラスが見つかりません"
                : `${academicYear}年度のクラスがまだ登録されていません`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              クラス一覧
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                ({paginationMeta.totalCount}件)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="学年"
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
                    <th className="px-4 py-2 text-left font-medium">担任</th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="生徒数"
                        sortKey="studentCount"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClasses.map((cls) => (
                    <tr key={cls.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{cls.gradeYear}年</td>
                      <td className="px-4 py-2">{cls.className}組</td>
                      <td className="px-4 py-2">
                        {cls.homeroomTeacher?.name ? (
                          cls.homeroomTeacher.name
                        ) : (
                          <Badge variant="destructive">担任未設定</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {cls._count.classStudents === 0 ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            0名
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {cls._count.classStudents}名
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/classes/${cls.id}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="mr-1 h-3 w-3" />
                              詳細
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(cls)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            編集
                          </Button>
                          <DeleteConfirmDialog
                            title="クラスを削除"
                            description="このクラスを削除しますか？関連する生徒の所属も削除されます。"
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                disabled={deletingId === cls.id}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                削除
                              </Button>
                            }
                            onConfirm={() => handleDelete(cls.id)}
                            isPending={deletingId === cls.id}
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
      )}

      {/* Pagination */}
      <div className="mt-4">
        <PaginationBar meta={paginationMeta} />
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クラスを編集</DialogTitle>
          </DialogHeader>

          {editDialog ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-gradeYear">学年</Label>
                <select
                  id="edit-gradeYear"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  value={editDialog.gradeYear}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      gradeYear: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1年</option>
                  <option value={2}>2年</option>
                  <option value={3}>3年</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-className">組名</Label>
                <Input
                  id="edit-className"
                  value={editDialog.className}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, className: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-homeroom">担任</Label>
                <select
                  id="edit-homeroom"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  value={editDialog.homeroomTeacherId}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      homeroomTeacherId: e.target.value,
                    })
                  }
                >
                  <option value="">未設定</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name ?? "(名前なし)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

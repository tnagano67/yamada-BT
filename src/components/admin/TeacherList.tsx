"use client";

import { Fragment, useState, useMemo, useCallback } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  updateTeacherRoleAction,
  toggleTeacherActiveAction,
  deleteTeacherAction,
} from "@/app/(admin)/admin/teachers/actions";
import { TeacherAssignments } from "./TeacherAssignments";
import { EditTeacherDialog } from "./EditTeacherDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableHeader, type SortDirection } from "./SortableHeader";
import { PaginationBar } from "./PaginationBar";
import type { PaginationMeta } from "@/lib/admin/pagination";
import { generateCsv, downloadCsv } from "@/lib/admin/csv-export";

interface TeacherItem {
  id: string;
  name: string | null;
  nameKana: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  _count: { teacherAssignments: number };
}

interface TeacherListProps {
  teachers: TeacherItem[];
  availableClasses: { id: string; label: string }[];
  stats: {
    teacherCount: number;
    subjectLeadCount: number;
    adminCount: number;
    activeCount: number;
    inactiveCount: number;
  };
  paginationMeta: PaginationMeta;
  filters: { role: string; status: string; search: string };
}

const ROLE_LABEL: Record<string, string> = {
  teacher: "教員",
  subject_lead: "教科主任",
  admin: "管理者",
};

export function TeacherList({
  teachers,
  availableClasses,
  stats,
  paginationMeta,
  filters,
}: TeacherListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Client-side sorting
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedTeachers = useMemo(() => {
    if (!sortKey || !sortDirection) return teachers;
    return [...teachers].sort((a, b) => {
      const aVal = (a[sortKey as keyof TeacherItem] as string | null) ?? "";
      const bVal = (b[sortKey as keyof TeacherItem] as string | null) ?? "";
      const cmp = aVal.localeCompare(bVal, "ja");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [teachers, sortKey, sortDirection]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filters change (unless page itself is being set)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(key);
    setSortDirection(direction);
  }

  async function handleRoleChange(userId: string, role: string) {
    setUpdatingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("role", role);
      await updateTeacherRoleAction(formData);
      toast.success("ロールを変更しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ロール変更に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    setUpdatingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("isActive", String(!isActive));
      await toggleTeacherActiveAction(formData);
      toast.success(isActive ? "無効化しました" : "有効化しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "状態変更に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(userId: string) {
    setUpdatingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      await deleteTeacherAction(formData);
      toast.success("教員を削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCsvExport() {
    const headers = ["氏名", "氏名カナ", "メールアドレス", "ロール", "状態"];
    const rows = teachers.map((t) => [
      t.name ?? "",
      t.nameKana ?? "",
      t.email ?? "",
      ROLE_LABEL[t.role] ?? t.role,
      t.isActive ? "有効" : "無効",
    ]);
    const csv = generateCsv(headers, rows);
    downloadCsv("teachers.csv", csv);
    toast.success("CSVをダウンロードしました");
  }

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1">
              <label className="text-xs font-medium">ロール</label>
              <select
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={filters.role}
                onChange={(e) => updateParams({ role: e.target.value })}
              >
                <option value="">すべて</option>
                <option value="teacher">教員</option>
                <option value="subject_lead">教科主任</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">状態</label>
              <select
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={filters.status}
                onChange={(e) => updateParams({ status: e.target.value })}
              >
                <option value="">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
              </select>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium">検索</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="氏名・メール・カナで検索..."
                    className="h-9 w-64"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button type="submit" variant="outline" size="sm" className="h-9">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
        <span>教員 {stats.teacherCount}名</span>
        <span>|</span>
        <span>教科主任 {stats.subjectLeadCount}名</span>
        <span>|</span>
        <span>管理者 {stats.adminCount}名</span>
        <span>|</span>
        <span>有効 {stats.activeCount}名</span>
        <span>|</span>
        <span>無効 {stats.inactiveCount}名</span>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              教員一覧（{paginationMeta.totalCount}名）
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCsvExport}>
              <Download className="mr-1 h-4 w-4" />
              CSV出力
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              教員が登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="氏名"
                        sortKey="name"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="メール"
                        sortKey="email"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">ロール</th>
                    <th className="px-4 py-2 text-left font-medium">担当数</th>
                    <th className="px-4 py-2 text-left font-medium">状態</th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeachers.map((t) => (
                    <Fragment key={t.id}>
                      <tr className="border-b last:border-0">
                        <td className="px-4 py-2">{t.name ?? "-"}</td>
                        <td className="px-4 py-2 text-xs">{t.email ?? "-"}</td>
                        <td className="px-4 py-2">
                          <select
                            className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                            value={t.role}
                            disabled={updatingId === t.id}
                            onChange={(e) =>
                              handleRoleChange(t.id, e.target.value)
                            }
                          >
                            <option value="teacher">教員</option>
                            <option value="subject_lead">教科主任</option>
                            <option value="admin">管理者</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="secondary">
                            {t._count.teacherAssignments}件
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={t.isActive ? "default" : "destructive"}
                          >
                            {t.isActive ? "有効" : "無効"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updatingId === t.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setEditingTeacher(t)}
                              >
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleToggleActive(t.id, t.isActive)
                                }
                              >
                                {t.isActive ? "無効化" : "有効化"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setExpandedId(
                                    expandedId === t.id ? null : t.id,
                                  )
                                }
                              >
                                担当クラス
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <DeleteConfirmDialog
                                  title="教員を削除"
                                  description={`${t.name ?? "この教員"}を削除しますか？この操作は取り消せません。`}
                                  trigger={
                                    <span className="flex w-full">削除</span>
                                  }
                                  onConfirm={() => handleDelete(t.id)}
                                  isPending={updatingId === t.id}
                                />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {expandedId === t.id && (
                        <tr>
                          <td colSpan={6} className="bg-muted/30 px-4 py-3">
                            <TeacherAssignments
                              teacherId={t.id}
                              availableClasses={availableClasses}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <PaginationBar meta={paginationMeta} />

      {/* State-controlled Edit Dialog */}
      {editingTeacher ? (
        <EditTeacherDialog
          teacher={editingTeacher}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingTeacher(null);
          }}
        />
      ) : null}
    </div>
  );
}

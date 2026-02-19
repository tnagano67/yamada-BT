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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGradeAction } from "@/app/(admin)/admin/grades/actions";
import { EditGradeDialog } from "./EditGradeDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableHeader, type SortDirection } from "./SortableHeader";
import { PaginationBar } from "./PaginationBar";
import type { PaginationMeta } from "@/lib/admin/pagination";

const GRADE_TYPE_LABELS: Record<string, string> = {
  new_words: "新出",
  review: "復習",
  complete: "総合",
};

interface GradeItem {
  id: string;
  subject: string;
  gradeNumber: number;
  gradeType: string;
  wordStart: number;
  wordEnd: number;
  reviewRangeStart: number | null;
  reviewRangeEnd: number | null;
  blockNumber: number;
  _count: { words: number };
}

interface GradeListProps {
  grades: GradeItem[];
  paginationMeta: PaginationMeta;
  filters: {
    subject: string;
    search: string;
  };
}

export function GradeList({
  grades,
  paginationMeta,
  filters,
}: GradeListProps) {
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
    if (!sortKey || !sortDirection) return grades;

    return [...grades].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "gradeNumber":
          cmp = a.gradeNumber - b.gradeNumber;
          break;
        case "wordStart":
          cmp = a.wordStart - b.wordStart;
          break;
        case "blockNumber":
          cmp = a.blockNumber - b.blockNumber;
          break;
        case "wordCount":
          cmp = a._count.words - b._count.words;
          break;
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [grades, sortKey, sortDirection]);

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(direction ? key : null);
    setSortDirection(direction);
  }

  async function handleDelete(gradeId: string) {
    setDeletingId(gradeId);
    try {
      const formData = new FormData();
      formData.set("gradeId", gradeId);
      await deleteGradeAction(formData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-medium">科目</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={filters.subject}
                onChange={(e) =>
                  updateSearchParams({ subject: e.target.value })
                }
              >
                <option value="">すべて</option>
                <option value="english">英語</option>
                <option value="japanese">日本語</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">ID検索</label>
              <Input
                className="h-8 w-48 text-sm"
                placeholder="E1, J5..."
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            グレード一覧（{paginationMeta.totalCount}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {paginationMeta.totalCount === 0
                ? "グレードが登録されていません"
                : "該当するグレードがありません"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="ID"
                        sortKey="id"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">科目</th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="番号"
                        sortKey="gradeNumber"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">タイプ</th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="単語範囲"
                        sortKey="wordStart"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      復習範囲
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="ブロック"
                        sortKey="blockNumber"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="単語数"
                        sortKey="wordCount"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((g) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{g.id}</td>
                      <td className="px-4 py-2">
                        {g.subject === "english" ? "英語" : "日本語"}
                      </td>
                      <td className="px-4 py-2">{g.gradeNumber}</td>
                      <td className="px-4 py-2">
                        {GRADE_TYPE_LABELS[g.gradeType] ?? g.gradeType}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {g.wordStart}〜{g.wordEnd}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {g.reviewRangeStart != null && g.reviewRangeEnd != null
                          ? `${g.reviewRangeStart}〜${g.reviewRangeEnd}`
                          : "-"}
                      </td>
                      <td className="px-4 py-2">{g.blockNumber}</td>
                      <td className="px-4 py-2">{g._count.words}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditGradeDialog grade={g} />
                          <DeleteConfirmDialog
                            title="グレードの削除"
                            description={`グレード "${g.id}" を削除しますか？この操作は取り消せません。`}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === g.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            onConfirm={() => handleDelete(g.id)}
                            isPending={deletingId === g.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
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

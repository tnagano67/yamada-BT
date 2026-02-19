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
import { deleteWordAction } from "@/app/(admin)/admin/words/actions";
import { EditWordDialog } from "./EditWordDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableHeader, type SortDirection } from "./SortableHeader";
import { PaginationBar } from "./PaginationBar";
import type { PaginationMeta } from "@/lib/admin/pagination";

interface GradeOption {
  id: string;
  subject: string;
  gradeNumber: number;
}

interface WordItem {
  id: string;
  wordNumber: number;
  subject: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  gradeId: string;
  categoryTags: string[];
  grade: { id: string; subject: string; gradeNumber: number };
}

interface WordListProps {
  words: WordItem[];
  grades: GradeOption[];
  paginationMeta: PaginationMeta;
  filters: {
    subject: string;
    gradeId: string;
    search: string;
  };
}

export function WordList({
  words,
  grades,
  paginationMeta,
  filters,
}: WordListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const filteredGradeOptions = useMemo(() => {
    if (!filters.subject) return grades;
    return grades.filter((g) => g.subject === filters.subject);
  }, [grades, filters.subject]);

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
    if (!sortKey || !sortDirection) return words;

    return [...words].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "wordNumber":
          cmp = a.wordNumber - b.wordNumber;
          break;
        case "word":
          cmp = a.word.localeCompare(b.word);
          break;
        case "meaning":
          cmp = a.meaning.localeCompare(b.meaning);
          break;
        case "gradeId":
          cmp = a.gradeId.localeCompare(b.gradeId);
          break;
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [words, sortKey, sortDirection]);

  function handleSort(key: string, direction: SortDirection) {
    setSortKey(direction ? key : null);
    setSortDirection(direction);
  }

  async function handleDelete(wordId: string) {
    setDeletingId(wordId);
    try {
      const formData = new FormData();
      formData.set("wordId", wordId);
      await deleteWordAction(formData);
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
                  updateSearchParams({
                    subject: e.target.value,
                    gradeId: "",
                  })
                }
              >
                <option value="">すべて</option>
                <option value="english">英語</option>
                <option value="japanese">日本語</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">グレード</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={filters.gradeId}
                onChange={(e) =>
                  updateSearchParams({ gradeId: e.target.value })
                }
              >
                <option value="">すべて</option>
                {filteredGradeOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">単語・意味検索</label>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            単語一覧（{paginationMeta.totalCount}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {paginationMeta.totalCount === 0
                ? "単語が登録されていません"
                : "該当する単語がありません"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="番号"
                        sortKey="wordNumber"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">科目</th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="単語"
                        sortKey="word"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="意味"
                        sortKey="meaning"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">品詞</th>
                    <th className="px-4 py-2 text-left">
                      <SortableHeader
                        label="グレード"
                        sortKey="gradeId"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium">タグ</th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((w) => (
                    <tr key={w.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{w.wordNumber}</td>
                      <td className="px-4 py-2">
                        {w.subject === "english" ? "英語" : "日本語"}
                      </td>
                      <td className="px-4 py-2">{w.word}</td>
                      <td className="px-4 py-2">{w.meaning}</td>
                      <td className="px-4 py-2 text-xs">
                        {w.partOfSpeech ?? "-"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {w.gradeId}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {w.categoryTags.length > 0
                          ? w.categoryTags.join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditWordDialog word={w} grades={grades} />
                          <DeleteConfirmDialog
                            title="単語の削除"
                            description={`単語 "${w.word}" を削除しますか？この操作は取り消せません。`}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === w.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            onConfirm={() => handleDelete(w.id)}
                            isPending={deletingId === w.id}
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

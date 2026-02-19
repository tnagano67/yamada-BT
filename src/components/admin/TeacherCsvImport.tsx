"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { parseTeacherCsv, type TeacherCsvRow } from "@/lib/admin/csv-parser";
import { importTeachersAction } from "@/app/(admin)/admin/teachers/actions";

const ROLE_LABELS: Record<string, string> = {
  teacher: "教員",
  subject_lead: "教科主任",
  admin: "管理者",
};

export function TeacherCsvImport() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<TeacherCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    { line: number; message: string }[]
  >([]);
  const [csvText, setCsvText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: { line: number; message: string }[];
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const parsed = parseTeacherCsv(text);
      setPreview(parsed.rows);
      setParseErrors(parsed.errors);
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("csvText", csvText);
      const importResult = await importTeachersAction(formData);
      setResult(importResult);
      if (importResult.errors.length === 0) {
        setTimeout(() => setOpen(false), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setPreview([]);
      setParseErrors([]);
      setCsvText("");
      setResult(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-1 h-4 w-4" />
          CSVインポート
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>教員CSVインポート</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">
              CSV形式: 氏名,氏名カナ,メールアドレス,ロール（教員/教科主任/管理者）
            </p>
            <p className="text-muted-foreground mb-2 text-xs">
              ※ロール列は省略可（省略時は「教員」）。既存メールアドレスの場合は情報を更新します。
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="mb-1 text-sm font-medium text-red-800">
                パースエラー
              </p>
              <ul className="text-xs text-red-700">
                {parseErrors.map((err, i) => (
                  <li key={i}>
                    行{err.line}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                プレビュー（{preview.length}件）
              </p>
              <div className="max-h-48 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-1 text-left">氏名</th>
                      <th className="px-2 py-1 text-left">カナ</th>
                      <th className="px-2 py-1 text-left">メール</th>
                      <th className="px-2 py-1 text-left">ロール</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-2 py-1">{row.name}</td>
                        <td className="px-2 py-1">{row.nameKana}</td>
                        <td className="px-2 py-1">{row.email}</td>
                        <td className="px-2 py-1">
                          {ROLE_LABELS[row.role] ?? row.role}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">
                    ...他{preview.length - 20}件
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <div
              className={`rounded-md border p-3 ${
                result.errors.length > 0
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <p className="text-sm font-medium">
                {result.imported}件をインポートしました
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-1 text-xs text-yellow-700">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      行{err.line}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || submitting}
          >
            {submitting ? "インポート中..." : `${preview.length}件をインポート`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

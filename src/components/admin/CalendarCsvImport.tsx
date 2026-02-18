"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseCalendarCsv } from "@/lib/calendar/csv-parser";
import type { CalendarCsvRow } from "@/lib/calendar/csv-parser";
import { importCalendarCsvAction } from "@/app/(admin)/admin/calendar/actions";

interface ImportResult {
  success: boolean;
  imported?: number;
  errors?: { line: number; message: string }[];
  error?: string;
}

export function CalendarCsvImport() {
  const [isPending, startTransition] = useTransition();
  const [previewRows, setPreviewRows] = useState<CalendarCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    { line: number; message: string }[]
  >([]);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const result = parseCalendarCsv(text);
      setPreviewRows(result.rows);
      setParseErrors(result.errors);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!csvText) return;

    const formData = new FormData();
    formData.set("csvText", csvText);

    startTransition(async () => {
      const result = await importCalendarCsvAction(formData);
      setImportResult(result);
      if (result.success) {
        setPreviewRows([]);
        setParseErrors([]);
        setCsvText("");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSVインポート</CardTitle>
        <CardDescription>
          CSV形式: date,dayType,hasMorningTest,note
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* File input */}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />

          {/* Parse errors */}
          {parseErrors.length > 0 ? (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-sm font-medium text-red-800">
                バリデーションエラー:
              </p>
              <ul className="space-y-1">
                {parseErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-700">
                    {err.line}行目: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Preview table */}
          {previewRows.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                プレビュー ({previewRows.length}件)
              </p>
              <div className="max-h-64 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5 text-left">日付</th>
                      <th className="px-3 py-1.5 text-left">タイプ</th>
                      <th className="px-3 py-1.5 text-left">朝テスト</th>
                      <th className="px-3 py-1.5 text-left">メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant="outline">{row.dayType}</Badge>
                        </td>
                        <td className="px-3 py-1.5">
                          {row.hasMorningTest ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                className="mt-3"
                onClick={handleImport}
                disabled={isPending}
              >
                {isPending
                  ? "インポート中..."
                  : `${previewRows.length}件をインポート`}
              </Button>
            </div>
          ) : null}

          {/* Import result */}
          {importResult ? (
            <div
              className={`rounded border p-3 ${
                importResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {importResult.success ? (
                <p className="text-sm text-green-800">
                  {importResult.imported}件をインポートしました
                </p>
              ) : (
                <p className="text-sm text-red-800">
                  {importResult.error}
                </p>
              )}
              {importResult.errors && importResult.errors.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">
                      {err.line}行目: {err.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TriangleAlert } from "lucide-react";
import { resetPartialDataAction } from "@/app/(admin)/admin/setup/actions";
import { toast } from "sonner";
import type { ResetScope } from "@/lib/admin/setup-service";

const CONFIRMATION_TEXT = "リセット";

const SCOPE_OPTIONS: { value: ResetScope; label: string }[] = [
  { value: "students", label: "生徒データのみ" },
  { value: "classes_students", label: "クラス + 生徒" },
  { value: "quiz_data", label: "クイズ・成績データ" },
  { value: "calendar", label: "カレンダー・学期データ" },
  { value: "all", label: "全データ（管理者以外）" },
];

const SCOPE_WARNINGS: Record<ResetScope, { items: string[] }> = {
  students: {
    items: [
      "生徒アカウント",
      "生徒のクラス所属情報",
      "生徒のクイズ履歴・成績",
      "生徒のストリーク・バッジ記録",
    ],
  },
  classes_students: {
    items: [
      "全クラス情報",
      "生徒アカウント",
      "担任・教科担当の紐付け",
      "生徒のクイズ履歴・成績",
    ],
  },
  quiz_data: {
    items: [
      "クイズ回答・採点履歴",
      "クイズ配信・スケジュール",
      "昇格進捗",
      "ストリーク・バッジ記録",
      "復習アイテム",
      "学期目標",
    ],
  },
  calendar: {
    items: [
      "学校カレンダー（全日程）",
      "学期設定",
      "スケジュール休止期間",
    ],
  },
  all: {
    items: [
      "教員アカウント（管理者以外）",
      "クラス・生徒の所属情報",
      "クイズ履歴・成績データ",
      "ストリーク・バッジ獲得記録",
      "配信スケジュール・カレンダー",
    ],
  },
};

export function ResetDataDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ResetScope>("students");
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText === CONFIRMATION_TEXT;
  const warning = SCOPE_WARNINGS[scope];

  function handleReset() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("scope", scope);
        const result = await resetPartialDataAction(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        toast.success("データをリセットしました");
        setOpen(false);
        setConfirmText("");
        setScope("students");
      } catch {
        setError("リセット中にエラーが発生しました");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setConfirmText("");
          setScope("students");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">データリセット</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            データリセット
          </DialogTitle>
          <DialogDescription>
            リセット対象を選択してください。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="scope">リセット対象</Label>
            <select
              id="scope"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              value={scope}
              onChange={(e) => setScope(e.target.value as ResetScope)}
              disabled={isPending}
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">削除されるデータ:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {warning.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm">
              確認のため「<span className="font-bold">{CONFIRMATION_TEXT}</span>
              」と入力してください:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_TEXT}
              disabled={isPending}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!canConfirm || isPending}
          >
            {isPending ? "リセット中..." : "リセット実行"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

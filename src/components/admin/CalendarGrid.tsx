"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SchoolCalendar, DayType } from "@/generated/prisma/client";
import {
  updateCalendarDayAction,
  bulkSetMorningTestAction,
} from "@/app/(admin)/admin/calendar/actions";
import { toast } from "sonner";

interface CalendarGridProps {
  entries: SchoolCalendar[];
  year: number;
  month: number;
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const DAY_TYPE_STYLES: Record<DayType, { bg: string; label: string }> = {
  school_day: { bg: "bg-green-100 text-green-800", label: "授業日" },
  weekend: { bg: "bg-gray-100 text-gray-600", label: "休日" },
  holiday: { bg: "bg-red-100 text-red-800", label: "祝日" },
  vacation: { bg: "bg-blue-100 text-blue-800", label: "長期休暇" },
  exam_period: { bg: "bg-yellow-100 text-yellow-800", label: "試験期間" },
  special: { bg: "bg-purple-100 text-purple-800", label: "特別日" },
};

const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "school_day", label: "授業日" },
  { value: "weekend", label: "休日" },
  { value: "holiday", label: "祝日" },
  { value: "vacation", label: "長期休暇" },
  { value: "exam_period", label: "試験期間" },
  { value: "special", label: "特別日" },
];

interface EditState {
  date: string;
  dayType: DayType;
  hasMorningTest: boolean;
  note: string;
}

export function CalendarGrid({ entries, year, month }: CalendarGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const [editDialog, setEditDialog] = useState<EditState | null>(null);

  const entryMap = new Map<number, SchoolCalendar>();
  for (const entry of entries) {
    const d = new Date(entry.date);
    entryMap.set(d.getUTCDate(), entry);
  }

  function navigateMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    router.push(`/admin/calendar?year=${newYear}&month=${newMonth}`);
  }

  function openEdit(dayNum: number) {
    const entry = entryMap.get(dayNum);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    setEditDialog({
      date: dateStr,
      dayType: entry?.dayType ?? "school_day",
      hasMorningTest: entry?.hasMorningTest ?? false,
      note: entry?.note ?? "",
    });
  }

  async function handleSave() {
    if (!editDialog) return;

    const formData = new FormData();
    formData.set("date", editDialog.date);
    formData.set("dayType", editDialog.dayType);
    formData.set("hasMorningTest", String(editDialog.hasMorningTest));
    formData.set("note", editDialog.note);

    startTransition(async () => {
      await updateCalendarDayAction(formData);
      setEditDialog(null);
      router.refresh();
    });
  }

  function handleBulkMorningTest() {
    startBulkTransition(async () => {
      const formData = new FormData();
      formData.set("year", String(year));
      formData.set("month", String(month));
      const result = await bulkSetMorningTestAction(formData);
      if (result.success) {
        toast.success(
          `${result.count}件の授業日に朝テストを設定しました`,
        );
        router.refresh();
      } else {
        toast.error(result.error ?? "設定に失敗しました");
      }
    });
  }

  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base">
              {year}年{month}月
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day-of-week header */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-muted-foreground py-1 text-xs font-medium"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const entry = entryMap.get(dayNum);
              const style = entry
                ? DAY_TYPE_STYLES[entry.dayType]
                : null;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => openEdit(dayNum)}
                  className={`flex h-20 flex-col items-center rounded border p-1 transition-colors hover:bg-accent ${
                    style ? style.bg : ""
                  }`}
                >
                  <span className="text-xs font-medium">{dayNum}</span>
                  {style ? (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {style.label}
                    </Badge>
                  ) : null}
                  {entry?.hasMorningTest ? (
                    <span className="mt-0.5 text-[9px] text-green-700">
                      朝テスト
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(DAY_TYPE_STYLES).map(([key, { bg, label }]) => (
              <div key={key} className="flex items-center gap-1">
                <span
                  className={`inline-block h-3 w-3 rounded ${bg.split(" ")[0]}`}
                />
                <span className="text-muted-foreground text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Bulk morning test button */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkPending}
              onClick={handleBulkMorningTest}
            >
              {isBulkPending
                ? "設定中..."
                : "朝テスト一括設定（今月の授業日）"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog?.date} の設定
            </DialogTitle>
          </DialogHeader>

          {editDialog ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="dayType">日タイプ</Label>
                <select
                  id="dayType"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  value={editDialog.dayType}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      dayType: e.target.value as DayType,
                    })
                  }
                >
                  {DAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasMorningTest"
                  checked={editDialog.hasMorningTest}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      hasMorningTest: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="hasMorningTest">朝テストあり</Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note">メモ</Label>
                <Input
                  id="note"
                  value={editDialog.note}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      note: e.target.value,
                    })
                  }
                  placeholder="例: 始業式"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(null)}
            >
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

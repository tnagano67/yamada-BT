"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SchoolCalendar, DayType } from "@/generated/prisma/client";
import { bulkSetMorningTestAction } from "@/app/(admin)/admin/calendar/actions";
import { toast } from "sonner";

interface YearOverviewGridProps {
  entries: SchoolCalendar[];
  year: number;
}

const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const DOT_COLORS: Record<DayType, string> = {
  school_day: "bg-green-400",
  weekend: "bg-gray-300",
  holiday: "bg-red-400",
  vacation: "bg-blue-400",
  exam_period: "bg-yellow-400",
  special: "bg-purple-400",
};

export function YearOverviewGrid({ entries, year }: YearOverviewGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Group entries by month (0-indexed)
  const monthGroups = new Map<number, SchoolCalendar[]>();
  for (let m = 0; m < 12; m++) {
    monthGroups.set(m, []);
  }
  for (const entry of entries) {
    const d = new Date(entry.date);
    const m = d.getUTCMonth();
    monthGroups.get(m)!.push(entry);
  }

  function handleBulkMonth(month: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("year", String(year));
      formData.set("month", String(month + 1));
      const result = await bulkSetMorningTestAction(formData);
      if (result.success) {
        toast.success(`${result.count}件の授業日に朝テストを設定しました`);
        router.refresh();
      } else {
        toast.error(result.error ?? "設定に失敗しました");
      }
    });
  }

  function handleBulkYear() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("year", String(year));
      const result = await bulkSetMorningTestAction(formData);
      if (result.success) {
        toast.success(`${result.count}件の授業日に朝テストを設定しました`);
        router.refresh();
      } else {
        toast.error(result.error ?? "設定に失敗しました");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{year}年 年間概要</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleBulkYear}
        >
          {isPending ? "設定中..." : "年間一括：朝テスト設定"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, m) => {
          const monthEntries = monthGroups.get(m)!;
          const morningTestCount = monthEntries.filter(
            (e) => e.hasMorningTest,
          ).length;
          const schoolDayCount = monthEntries.filter(
            (e) => e.dayType === "school_day",
          ).length;
          const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();

          return (
            <Card key={m}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{MONTH_NAMES[m]}</span>
                  <span className="text-muted-foreground text-xs">
                    朝テスト {morningTestCount}/{schoolDayCount}日
                  </span>
                </div>
                <div className="mb-2 flex flex-wrap gap-0.5">
                  {Array.from({ length: daysInMonth }, (_, d) => {
                    const entry = monthEntries.find((e) => {
                      const date = new Date(e.date);
                      return date.getUTCDate() === d + 1;
                    });
                    const color = entry
                      ? DOT_COLORS[entry.dayType]
                      : "bg-gray-200";
                    const hasMT = entry?.hasMorningTest;
                    return (
                      <span
                        key={d}
                        className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${
                          hasMT ? "ring-1 ring-green-600" : ""
                        }`}
                        title={`${m + 1}/${d + 1}${entry ? ` (${entry.dayType})` : ""}${hasMT ? " 朝テスト" : ""}`}
                      />
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  disabled={isPending}
                  onClick={() => handleBulkMonth(m)}
                >
                  朝テスト一括設定
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(DOT_COLORS).map(([type, color]) => {
          const labels: Record<string, string> = {
            school_day: "授業日",
            weekend: "休日",
            holiday: "祝日",
            vacation: "長期休暇",
            exam_period: "試験期間",
            special: "特別日",
          };
          return (
            <div key={type} className="flex items-center gap-1">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
              />
              <span className="text-muted-foreground text-xs">
                {labels[type]}
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-200 ring-1 ring-green-600" />
          <span className="text-muted-foreground text-xs">朝テストあり</span>
        </div>
      </div>
    </div>
  );
}

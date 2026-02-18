"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CalendarDay } from "@/lib/schedule/types";
import type { Subject } from "@/generated/prisma/client";
import { DAY_LABELS } from "@/lib/schedule/constants";

interface DeliveryCalendarProps {
  days: CalendarDay[];
  year: number;
  month: number;
  subject: Subject;
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  scheduled: { bg: "bg-blue-100 text-blue-800", label: "予定" },
  active: { bg: "bg-green-100 text-green-800", label: "配信中" },
  closed: { bg: "bg-gray-100 text-gray-600", label: "終了" },
  cancelled: { bg: "bg-red-100 text-red-800", label: "中止" },
  suspended: {
    bg: "bg-yellow-50 text-yellow-800 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(234,179,8,0.1)_4px,rgba(234,179,8,0.1)_8px)]",
    label: "休止",
  },
};

export function DeliveryCalendar({
  days,
  year,
  month,
  subject,
}: DeliveryCalendarProps) {
  const router = useRouter();

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
    router.push(
      `/teacher/schedule?subject=${subject}&year=${newYear}&month=${newMonth}`,
    );
  }

  // 月の最初の日の曜日
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">
            {year}年{month}月
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 曜日ヘッダー */}
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

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* 月初のオフセット（空セル） */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="h-16" />
          ))}

          {/* 日付セル */}
          {days.map((day, i) => {
            const status = day.deliveryStatus;
            const style = status ? STATUS_STYLES[status] : null;
            const dateNum = i + 1;

            return (
              <div
                key={dateNum}
                className={`flex h-16 flex-col items-center rounded border p-1 ${
                  style ? style.bg : ""
                }`}
              >
                <span className="text-xs font-medium">{dateNum}</span>
                {style ? (
                  <span className="mt-1 text-[10px]">{style.label}</span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(STATUS_STYLES).map(([key, { bg, label }]) => (
            <div key={key} className="flex items-center gap-1">
              <span
                className={`inline-block h-3 w-3 rounded ${bg.split(" ")[0]}`}
              />
              <span className="text-muted-foreground text-xs">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

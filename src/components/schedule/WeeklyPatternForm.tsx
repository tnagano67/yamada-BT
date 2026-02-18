"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DAY_LABELS } from "@/lib/schedule/constants";
import type { SchedulePattern } from "@/lib/schedule/types";
import type { Subject } from "@/generated/prisma/client";
import { updateSchedulePatternAction } from "@/app/(teacher)/teacher/schedule/actions";

interface WeeklyPatternFormProps {
  academicYear: number;
  semester: number;
  subject: Subject;
  initialPatterns: SchedulePattern[];
}

export function WeeklyPatternForm({
  academicYear,
  semester,
  subject,
  initialPatterns,
}: WeeklyPatternFormProps) {
  const [patterns, setPatterns] = useState<SchedulePattern[]>(initialPatterns);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function updatePattern(
    dayOfWeek: number,
    updates: Partial<SchedulePattern>,
  ) {
    setPatterns((prev) =>
      prev.map((p) =>
        p.dayOfWeek === dayOfWeek ? { ...p, ...updates } : p,
      ),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSchedulePatternAction(
        academicYear,
        semester,
        subject,
        patterns,
      );
      setMessage(
        result.success ? "保存しました" : result.error ?? "エラーが発生しました",
      );
      setTimeout(() => setMessage(null), 3000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          曜日別配信パターン（{subject === "english" ? "英語" : "日本語"}）
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patterns.map((pattern) => (
            <div
              key={pattern.dayOfWeek}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pattern.isActive}
                  onChange={(e) =>
                    updatePattern(pattern.dayOfWeek, {
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="w-6 font-medium">
                  {DAY_LABELS[pattern.dayOfWeek]}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <Label className="text-xs">配信</Label>
                <Input
                  type="time"
                  value={pattern.deliveryTime}
                  onChange={(e) =>
                    updatePattern(pattern.dayOfWeek, {
                      deliveryTime: e.target.value,
                    })
                  }
                  disabled={!pattern.isActive}
                  className="w-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs">締切</Label>
                <Input
                  type="number"
                  value={pattern.deadlineMinutes}
                  onChange={(e) =>
                    updatePattern(pattern.dayOfWeek, {
                      deadlineMinutes: Number(e.target.value),
                    })
                  }
                  disabled={!pattern.isActive}
                  className="w-20"
                  min={5}
                  max={60}
                />
                <span className="text-muted-foreground text-xs">分</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>
          {message ? (
            <span className="text-sm text-green-600">{message}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

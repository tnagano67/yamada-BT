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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Semester } from "@/generated/prisma/client";
import {
  updateSemesterAction,
  generateWeekendsAction,
} from "@/app/(admin)/admin/calendar/actions";

interface SemesterSettingsProps {
  semesters: Semester[];
  academicYear: number;
}

const TERM_LABELS = ["1学期", "2学期", "3学期"];

function formatDateValue(date: Date | string): string {
  const d = new Date(date);
  // @db.Date は UTC midnight で格納されるため、UTC日付を抽出
  return d.toISOString().split("T")[0];
}

export function SemesterSettings({
  semesters,
  academicYear,
}: SemesterSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedYear, setSelectedYear] = useState(academicYear);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Initialize form state from existing semesters
  const [semesterForms, setSemesterForms] = useState(
    TERM_LABELS.map((_, i) => {
      const term = i + 1;
      const existing = semesters.find((s) => s.term === term);
      return {
        term,
        startDate: existing ? formatDateValue(existing.startDate) : "",
        endDate: existing ? formatDateValue(existing.endDate) : "",
      };
    }),
  );

  function updateForm(
    index: number,
    field: "startDate" | "endDate",
    value: string,
  ) {
    setSemesterForms((prev) =>
      prev.map((form, i) =>
        i === index ? { ...form, [field]: value } : form,
      ),
    );
  }

  async function handleSaveSemester(index: number) {
    const form = semesterForms[index];
    if (!form.startDate || !form.endDate) {
      setMessage({ type: "error", text: "開始日と終了日を入力してください" });
      return;
    }

    const formData = new FormData();
    formData.set("academicYear", String(selectedYear));
    formData.set("term", String(form.term));
    formData.set("startDate", form.startDate);
    formData.set("endDate", form.endDate);

    startTransition(async () => {
      const result = await updateSemesterAction(formData);
      if (result.success) {
        setMessage({ type: "success", text: `${TERM_LABELS[index]}を保存しました` });
      } else {
        setMessage({ type: "error", text: result.error ?? "保存に失敗しました" });
      }
      router.refresh();
    });
  }

  async function handleGenerateWeekends() {
    const formData = new FormData();
    formData.set("year", String(selectedYear));

    startTransition(async () => {
      const result = await generateWeekendsAction(formData);
      if (result.success) {
        setMessage({
          type: "success",
          text: `${result.count}件の土日エントリーを生成しました`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "生成に失敗しました",
        });
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {/* Year selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">年度選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Label htmlFor="academicYear">年度</Label>
            <Input
              id="academicYear"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-32"
            />
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/admin/calendar?year=${selectedYear}&month=${new Date().getMonth() + 1}`,
                )
              }
            >
              表示
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message ? (
        <div
          className={`rounded border p-3 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      ) : null}

      {/* Semester forms */}
      {semesterForms.map((form, index) => (
        <Card key={form.term}>
          <CardHeader>
            <CardTitle className="text-base">{TERM_LABELS[index]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`start-${form.term}`}>開始日</Label>
                <Input
                  id={`start-${form.term}`}
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    updateForm(index, "startDate", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`end-${form.term}`}>終了日</Label>
                <Input
                  id={`end-${form.term}`}
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    updateForm(index, "endDate", e.target.value)
                  }
                />
              </div>
              <Button
                onClick={() => handleSaveSemester(index)}
                disabled={isPending}
              >
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Separator />

      {/* Weekend generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">土日一括生成</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            {selectedYear}年の全ての土曜日・日曜日を「休日」としてカレンダーに登録します。
          </p>
          <Button
            variant="outline"
            onClick={handleGenerateWeekends}
            disabled={isPending}
          >
            {isPending
              ? "生成中..."
              : `${selectedYear}年の土日を一括生成`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

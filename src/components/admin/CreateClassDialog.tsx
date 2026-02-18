"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createClassAction } from "@/app/(admin)/admin/classes/actions";

interface CreateClassDialogProps {
  academicYear: number;
  teachers: { id: string; name: string | null }[];
}

export function CreateClassDialog({
  academicYear,
  teachers,
}: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("academicYear", String(academicYear));
      await createClassAction(formData);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          クラスを追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規クラス作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gradeYear">学年</Label>
              <select
                id="gradeYear"
                name="gradeYear"
                required
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              >
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="className">組</Label>
              <Input
                id="className"
                name="className"
                placeholder="A"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="homeroomTeacherId">担任（任意）</Label>
              <select
                id="homeroomTeacherId"
                name="homeroomTeacherId"
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              >
                <option value="">未設定</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? "名前なし"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { createStudentAction } from "@/app/(admin)/admin/students/actions";
import { createStudentWithClassAction } from "@/app/(admin)/admin/students/actions";

interface ClassOption {
  id: string;
  gradeYear: number;
  className: string;
}

interface AddStudentDialogProps {
  classes: ClassOption[];
}

export function AddStudentDialog({ classes }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      if (selectedClassId) {
        await createStudentWithClassAction(formData);
      } else {
        await createStudentAction(formData);
      }
      setOpen(false);
      setSelectedClassId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedClassId("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          生徒を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規生徒追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">氏名</Label>
              <Input id="name" name="name" placeholder="山田 花子" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameKana">氏名（カナ）</Label>
              <Input
                id="nameKana"
                name="nameKana"
                placeholder="ヤマダ ハナコ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="yamada.hanako@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="classId">クラス（任意）</Label>
              <select
                id="classId"
                name="classId"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">クラスを選択しない</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.gradeYear}年{c.className}組
                  </option>
                ))}
              </select>
            </div>
            {selectedClassId ? (
              <div className="grid gap-2">
                <Label htmlFor="studentNumber">出席番号</Label>
                <Input
                  id="studentNumber"
                  name="studentNumber"
                  type="number"
                  min={1}
                  placeholder="1"
                  required
                />
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

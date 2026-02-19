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
import { Pencil } from "lucide-react";
import { updateStudentAction } from "@/app/(admin)/admin/students/actions";

interface EditStudentDialogProps {
  student: {
    id: string;
    name: string | null;
    nameKana: string | null;
    email: string | null;
  };
}

export function EditStudentDialog({ student }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("userId", student.id);
      await updateStudentAction(formData);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>生徒情報の編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`name-${student.id}`}>氏名</Label>
              <Input
                id={`name-${student.id}`}
                name="name"
                defaultValue={student.name ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`nameKana-${student.id}`}>氏名（カナ）</Label>
              <Input
                id={`nameKana-${student.id}`}
                name="nameKana"
                defaultValue={student.nameKana ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`email-${student.id}`}>メールアドレス</Label>
              <Input
                id={`email-${student.id}`}
                name="email"
                type="email"
                defaultValue={student.email ?? ""}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

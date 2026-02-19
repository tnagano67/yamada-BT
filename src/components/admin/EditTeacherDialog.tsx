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
import { updateTeacherAction } from "@/app/(admin)/admin/teachers/actions";

interface EditTeacherDialogProps {
  teacher: {
    id: string;
    name: string | null;
    nameKana: string | null;
    email: string | null;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditTeacherDialog({
  teacher,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditTeacherDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled
    ? controlledOnOpenChange!
    : setInternalOpen;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("userId", teacher.id);
      await updateTeacherAction(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>教員情報の編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`name-${teacher.id}`}>氏名</Label>
              <Input
                id={`name-${teacher.id}`}
                name="name"
                defaultValue={teacher.name ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`nameKana-${teacher.id}`}>氏名（カナ）</Label>
              <Input
                id={`nameKana-${teacher.id}`}
                name="nameKana"
                defaultValue={teacher.nameKana ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`email-${teacher.id}`}>メールアドレス</Label>
              <Input
                id={`email-${teacher.id}`}
                name="email"
                type="email"
                defaultValue={teacher.email ?? ""}
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

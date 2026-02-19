"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addStudentToClassAction } from "@/app/(admin)/admin/classes/actions";

interface AddStudentToClassDialogProps {
  classId: string;
}

export function AddStudentToClassDialog({
  classId,
}: AddStudentToClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("classId", classId);

    startTransition(async () => {
      try {
        await addStudentToClassAction(formData);
        toast.success("生徒を追加しました");
        setOpen(false);
        form.reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "生徒の追加に失敗しました"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          生徒を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>生徒を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-student-name">氏名 *</Label>
            <Input
              id="add-student-name"
              name="name"
              required
              placeholder="山田 太郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-student-nameKana">氏名カナ</Label>
            <Input
              id="add-student-nameKana"
              name="nameKana"
              placeholder="ヤマダ タロウ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-student-email">メールアドレス *</Label>
            <Input
              id="add-student-email"
              name="email"
              type="email"
              required
              placeholder="taro.yamada@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-student-number">出席番号 *</Label>
            <Input
              id="add-student-number"
              name="studentNumber"
              type="number"
              required
              min={1}
              placeholder="1"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

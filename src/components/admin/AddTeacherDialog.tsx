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
import { createTeacherAction } from "@/app/(admin)/admin/teachers/actions";

export function AddTeacherDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await createTeacherAction(formData);
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
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          教員を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規教員追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">氏名</Label>
              <Input id="name" name="name" placeholder="山田 太郎" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameKana">氏名（カナ）</Label>
              <Input
                id="nameKana"
                name="nameKana"
                placeholder="ヤマダ タロウ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="yamada@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">ロール</Label>
              <select
                id="role"
                name="role"
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                defaultValue="teacher"
              >
                <option value="teacher">教員</option>
                <option value="subject_lead">教科主任</option>
                <option value="admin">管理者</option>
              </select>
            </div>
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

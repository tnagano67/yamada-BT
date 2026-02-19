"use client";

import { useState, useMemo } from "react";
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
import { createWordAction } from "@/app/(admin)/admin/words/actions";

interface GradeOption {
  id: string;
  subject: string;
  gradeNumber: number;
}

interface AddWordDialogProps {
  grades: GradeOption[];
}

export function AddWordDialog({ grades }: AddWordDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("english");

  const filteredGrades = useMemo(
    () => grades.filter((g) => g.subject === subject),
    [grades, subject],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await createWordAction(formData);
      setOpen(false);
      setSubject("english");
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
          setSubject("english");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          単語を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規単語追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">科目</Label>
                <select
                  id="subject"
                  name="subject"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="english">英語</option>
                  <option value="japanese">日本語</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wordNumber">単語番号</Label>
                <Input
                  id="wordNumber"
                  name="wordNumber"
                  type="number"
                  min={1}
                  placeholder="1"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="word">単語</Label>
              <Input
                id="word"
                name="word"
                placeholder={subject === "english" ? "apple" : "曖昧"}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meaning">意味</Label>
              <Input
                id="meaning"
                name="meaning"
                placeholder={subject === "english" ? "りんご" : "あいまい"}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="partOfSpeech">品詞（任意）</Label>
                <Input
                  id="partOfSpeech"
                  name="partOfSpeech"
                  placeholder={subject === "english" ? "noun" : "名詞"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gradeId">グレード</Label>
                <select
                  id="gradeId"
                  name="gradeId"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  required
                >
                  <option value="">選択してください</option>
                  {filteredGrades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryTags">カテゴリタグ（任意、カンマ区切り）</Label>
              <Input
                id="categoryTags"
                name="categoryTags"
                placeholder="food, fruit"
              />
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

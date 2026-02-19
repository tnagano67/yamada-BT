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
import { Pencil } from "lucide-react";
import { updateWordAction } from "@/app/(admin)/admin/words/actions";

interface GradeOption {
  id: string;
  subject: string;
  gradeNumber: number;
}

interface EditWordDialogProps {
  word: {
    id: string;
    wordNumber: number;
    subject: string;
    word: string;
    meaning: string;
    partOfSpeech: string | null;
    gradeId: string;
    categoryTags: string[];
  };
  grades: GradeOption[];
}

export function EditWordDialog({ word, grades }: EditWordDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredGrades = useMemo(
    () => grades.filter((g) => g.subject === word.subject),
    [grades, word.subject],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("wordId", word.id);
      await updateWordAction(formData);
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
          <DialogTitle>
            単語編集: {word.word}（#{word.wordNumber}）
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>科目</Label>
                <Input
                  value={word.subject === "english" ? "英語" : "日本語"}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label>単語番号</Label>
                <Input value={word.wordNumber} disabled />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`word-${word.id}`}>単語</Label>
              <Input
                id={`word-${word.id}`}
                name="word"
                defaultValue={word.word}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`meaning-${word.id}`}>意味</Label>
              <Input
                id={`meaning-${word.id}`}
                name="meaning"
                defaultValue={word.meaning}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`partOfSpeech-${word.id}`}>品詞（任意）</Label>
                <Input
                  id={`partOfSpeech-${word.id}`}
                  name="partOfSpeech"
                  defaultValue={word.partOfSpeech ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`gradeId-${word.id}`}>グレード</Label>
                <select
                  id={`gradeId-${word.id}`}
                  name="gradeId"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  defaultValue={word.gradeId}
                  required
                >
                  {filteredGrades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`categoryTags-${word.id}`}>
                カテゴリタグ（カンマ区切り）
              </Label>
              <Input
                id={`categoryTags-${word.id}`}
                name="categoryTags"
                defaultValue={word.categoryTags.join(", ")}
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

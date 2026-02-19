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
import { updateGradeAction } from "@/app/(admin)/admin/grades/actions";

interface EditGradeDialogProps {
  grade: {
    id: string;
    subject: string;
    gradeNumber: number;
    gradeType: string;
    wordStart: number;
    wordEnd: number;
    reviewRangeStart: number | null;
    reviewRangeEnd: number | null;
    blockNumber: number;
  };
}

export function EditGradeDialog({ grade }: EditGradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeType, setGradeType] = useState(grade.gradeType);

  const showReviewRange = gradeType === "review" || gradeType === "complete";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("gradeId", grade.id);
      await updateGradeAction(formData);
      setOpen(false);
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
          setGradeType(grade.gradeType);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>グレード編集: {grade.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>科目</Label>
                <Input
                  value={grade.subject === "english" ? "英語" : "日本語"}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label>グレード番号</Label>
                <Input value={grade.gradeNumber} disabled />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`gradeType-${grade.id}`}>タイプ</Label>
              <select
                id={`gradeType-${grade.id}`}
                name="gradeType"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={gradeType}
                onChange={(e) => setGradeType(e.target.value)}
                required
              >
                <option value="new_words">新出単語 (new_words)</option>
                <option value="review">復習 (review)</option>
                <option value="complete">総合 (complete)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`wordStart-${grade.id}`}>
                  単語範囲（開始）
                </Label>
                <Input
                  id={`wordStart-${grade.id}`}
                  name="wordStart"
                  type="number"
                  min={1}
                  defaultValue={grade.wordStart}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`wordEnd-${grade.id}`}>単語範囲（終了）</Label>
                <Input
                  id={`wordEnd-${grade.id}`}
                  name="wordEnd"
                  type="number"
                  min={1}
                  defaultValue={grade.wordEnd}
                  required
                />
              </div>
            </div>
            {showReviewRange ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`reviewRangeStart-${grade.id}`}>
                    復習範囲（開始）
                  </Label>
                  <Input
                    id={`reviewRangeStart-${grade.id}`}
                    name="reviewRangeStart"
                    type="number"
                    min={1}
                    defaultValue={grade.reviewRangeStart ?? ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`reviewRangeEnd-${grade.id}`}>
                    復習範囲（終了）
                  </Label>
                  <Input
                    id={`reviewRangeEnd-${grade.id}`}
                    name="reviewRangeEnd"
                    type="number"
                    min={1}
                    defaultValue={grade.reviewRangeEnd ?? ""}
                    required
                  />
                </div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor={`blockNumber-${grade.id}`}>ブロック番号</Label>
              <Input
                id={`blockNumber-${grade.id}`}
                name="blockNumber"
                type="number"
                min={1}
                defaultValue={grade.blockNumber}
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

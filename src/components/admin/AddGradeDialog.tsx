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
import { createGradeAction } from "@/app/(admin)/admin/grades/actions";

export function AddGradeDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("english");
  const [gradeType, setGradeType] = useState("new_words");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await createGradeAction(formData);
      setOpen(false);
      setSubject("english");
      setGradeType("new_words");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  const showReviewRange = gradeType === "review" || gradeType === "complete";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSubject("english");
          setGradeType("new_words");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          グレードを追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規グレード追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="gradeNumber">グレード番号</Label>
              <Input
                id="gradeNumber"
                name="gradeNumber"
                type="number"
                min={1}
                placeholder="1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id">グレードID</Label>
              <Input
                id="id"
                name="id"
                placeholder={subject === "english" ? "E1" : "J1"}
                required
              />
              <p className="text-muted-foreground text-xs">
                英語: E1〜E48、日本語: J1〜J20
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gradeType">タイプ</Label>
              <select
                id="gradeType"
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
                <Label htmlFor="wordStart">単語範囲（開始）</Label>
                <Input
                  id="wordStart"
                  name="wordStart"
                  type="number"
                  min={1}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wordEnd">単語範囲（終了）</Label>
                <Input
                  id="wordEnd"
                  name="wordEnd"
                  type="number"
                  min={1}
                  required
                />
              </div>
            </div>
            {showReviewRange ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reviewRangeStart">復習範囲（開始）</Label>
                  <Input
                    id="reviewRangeStart"
                    name="reviewRangeStart"
                    type="number"
                    min={1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reviewRangeEnd">復習範囲（終了）</Label>
                  <Input
                    id="reviewRangeEnd"
                    name="reviewRangeEnd"
                    type="number"
                    min={1}
                    required
                  />
                </div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="blockNumber">ブロック番号</Label>
              <Input
                id="blockNumber"
                name="blockNumber"
                type="number"
                min={1}
                placeholder="1"
                required
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

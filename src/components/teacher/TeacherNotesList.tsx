"use client";

import { useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NoteItem {
  id: string;
  content: string;
  teacherName: string | null;
  createdAt: Date;
}

interface TeacherNotesListProps {
  notes: NoteItem[];
  addNoteAction: (content: string) => Promise<void>;
  deleteNoteAction: (noteId: string) => Promise<void>;
}

export function TeacherNotesList({
  notes,
  addNoteAction,
  deleteNoteAction,
}: TeacherNotesListProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      await addNoteAction(content);
      formRef.current?.reset();
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      await deleteNoteAction(noteId);
    });
  }

  return (
    <div className="space-y-4">
      {/* メモ追加フォーム */}
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <input
          name="content"
          type="text"
          placeholder="メモを追加..."
          className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "追加中..." : "追加"}
        </Button>
      </form>

      {/* メモ一覧 */}
      {notes.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">
          メモはありません
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-medium">
                      {note.teacherName ?? "教員"}
                    </CardTitle>
                    <span className="text-muted-foreground text-xs">
                      {new Date(note.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    disabled={isPending}
                    className="text-muted-foreground h-6 px-2 text-xs hover:text-red-500"
                  >
                    削除
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

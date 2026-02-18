"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, ExternalLink, Pencil } from "lucide-react";
import {
  deleteClassAction,
  updateClassAction,
} from "@/app/(admin)/admin/classes/actions";

interface ClassItem {
  id: string;
  gradeYear: number;
  className: string;
  homeroomTeacher: { id: string; name: string | null } | null;
  _count: { classStudents: number };
}

interface TeacherOption {
  id: string;
  name: string | null;
}

interface ClassListProps {
  classes: ClassItem[];
  academicYear: number;
  teachers: TeacherOption[];
}

interface EditState {
  id: string;
  gradeYear: number;
  className: string;
  homeroomTeacherId: string;
}

export function ClassList({ classes, academicYear, teachers }: ClassListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<EditState | null>(null);
  const [isPending, startTransition] = useTransition();

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            {academicYear}年度のクラスがまだ登録されていません
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("このクラスを削除しますか？関連する生徒の所属も削除されます。")) {
      return;
    }
    setDeletingId(id);
    try {
      const formData = new FormData();
      formData.set("id", id);
      await deleteClassAction(formData);
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(cls: ClassItem) {
    setEditDialog({
      id: cls.id,
      gradeYear: cls.gradeYear,
      className: cls.className,
      homeroomTeacherId: cls.homeroomTeacher?.id ?? "",
    });
  }

  function handleSave() {
    if (!editDialog) return;

    const formData = new FormData();
    formData.set("id", editDialog.id);
    formData.set("gradeYear", String(editDialog.gradeYear));
    formData.set("className", editDialog.className);
    formData.set("homeroomTeacherId", editDialog.homeroomTeacherId);

    startTransition(async () => {
      await updateClassAction(formData);
      setEditDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>クラス一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">学年</th>
                  <th className="px-4 py-2 text-left font-medium">組</th>
                  <th className="px-4 py-2 text-left font-medium">担任</th>
                  <th className="px-4 py-2 text-left font-medium">生徒数</th>
                  <th className="px-4 py-2 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{cls.gradeYear}年</td>
                    <td className="px-4 py-2">{cls.className}組</td>
                    <td className="px-4 py-2">
                      {cls.homeroomTeacher?.name ?? (
                        <span className="text-muted-foreground">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">
                        {cls._count.classStudents}名
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/classes/${cls.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            詳細
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(cls)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === cls.id}
                          onClick={() => handleDelete(cls.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          削除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クラスを編集</DialogTitle>
          </DialogHeader>

          {editDialog ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-gradeYear">学年</Label>
                <select
                  id="edit-gradeYear"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  value={editDialog.gradeYear}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      gradeYear: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1年</option>
                  <option value={2}>2年</option>
                  <option value={3}>3年</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-className">組名</Label>
                <Input
                  id="edit-className"
                  value={editDialog.className}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, className: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-homeroom">担任</Label>
                <select
                  id="edit-homeroom"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  value={editDialog.homeroomTeacherId}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      homeroomTeacherId: e.target.value,
                    })
                  }
                >
                  <option value="">未設定</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name ?? "(名前なし)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

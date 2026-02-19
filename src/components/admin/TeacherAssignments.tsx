"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import {
  assignTeacherAction,
  removeAssignmentAction,
  getTeacherAssignmentsAction,
} from "@/app/(admin)/admin/teachers/actions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface Assignment {
  id: string;
  role: string;
  subject: string | null;
  class: {
    id: string;
    academicYear: number;
    gradeYear: number;
    className: string;
  };
}

interface TeacherAssignmentsProps {
  teacherId: string;
  availableClasses: { id: string; label: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  homeroom: "担任",
  subject_teacher: "教科担当",
};

const SUBJECT_LABELS: Record<string, string> = {
  english: "英語",
  japanese: "日本語",
};

export function TeacherAssignments({
  teacherId,
  availableClasses,
}: TeacherAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedRole, setSelectedRole] = useState("subject_teacher");
  const [selectedSubject, setSelectedSubject] = useState("english");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeacherAssignmentsAction(teacherId);
      setAssignments(data as Assignment[]);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function handleRemove(assignmentId: string) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("assignmentId", assignmentId);
      await removeAssignmentAction(formData);
      await loadAssignments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("teacherId", teacherId);
      formData.set("classId", selectedClass);
      formData.set("role", selectedRole);
      if (selectedRole === "subject_teacher") {
        formData.set("subject", selectedSubject);
      }
      await assignTeacherAction(formData);
      await loadAssignments();
      setShowAddForm(false);
      setSelectedClass("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">読み込み中...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">担当クラス</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-muted-foreground text-xs">担当クラスなし</p>
      ) : (
        <div className="space-y-1">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span>
                  {a.class.gradeYear}年{a.class.className}組
                </span>
                <Badge variant="outline">
                  {ROLE_LABELS[a.role] ?? a.role}
                </Badge>
                {a.subject && (
                  <Badge variant="secondary">
                    {SUBJECT_LABELS[a.subject] ?? a.subject}
                  </Badge>
                )}
              </div>
              <DeleteConfirmDialog
                title="担当を削除"
                description="この担当を削除しますか？"
                trigger={
                  <Button variant="ghost" size="sm" disabled={submitting}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                }
                onConfirm={() => handleRemove(a.id)}
                isPending={submitting}
              />
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-2 rounded-md border bg-background p-3"
        >
          <div className="grid gap-1">
            <label className="text-xs font-medium">クラス</label>
            <select
              className="border-input bg-background h-8 rounded-md border px-2 text-xs"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">選択...</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium">役割</label>
            <select
              className="border-input bg-background h-8 rounded-md border px-2 text-xs"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="homeroom">担任</option>
              <option value="subject_teacher">教科担当</option>
            </select>
          </div>
          {selectedRole === "subject_teacher" && (
            <div className="grid gap-1">
              <label className="text-xs font-medium">教科</label>
              <select
                className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="english">英語</option>
                <option value="japanese">日本語</option>
              </select>
            </div>
          )}
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "追加中..." : "追加"}
          </Button>
        </form>
      )}
    </div>
  );
}

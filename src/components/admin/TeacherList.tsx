"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  updateTeacherRoleAction,
  toggleTeacherActiveAction,
} from "@/app/(admin)/admin/teachers/actions";
import { TeacherAssignments } from "./TeacherAssignments";

interface TeacherItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  _count: { teacherAssignments: number };
}

interface TeacherListProps {
  teachers: TeacherItem[];
  availableClasses: { id: string; label: string }[];
}

export function TeacherList({ teachers, availableClasses }: TeacherListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">教員が登録されていません</p>
        </CardContent>
      </Card>
    );
  }

  async function handleRoleChange(userId: string, role: string) {
    setUpdatingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("role", role);
      await updateTeacherRoleAction(formData);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    setUpdatingId(userId);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("isActive", String(!isActive));
      await toggleTeacherActiveAction(formData);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>教員一覧（{teachers.length}名）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">氏名</th>
                <th className="px-4 py-2 text-left font-medium">メール</th>
                <th className="px-4 py-2 text-left font-medium">ロール</th>
                <th className="px-4 py-2 text-left font-medium">担当数</th>
                <th className="px-4 py-2 text-left font-medium">状態</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <Fragment key={t.id}>
                  <tr className="border-b last:border-0">
                    <td className="px-4 py-2">{t.name ?? "-"}</td>
                    <td className="px-4 py-2 text-xs">{t.email ?? "-"}</td>
                    <td className="px-4 py-2">
                      <select
                        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                        value={t.role}
                        disabled={updatingId === t.id}
                        onChange={(e) =>
                          handleRoleChange(t.id, e.target.value)
                        }
                      >
                        <option value="teacher">教員</option>
                        <option value="subject_lead">教科主任</option>
                        <option value="admin">管理者</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">
                        {t._count.teacherAssignments}件
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={t.isActive ? "default" : "destructive"}>
                        {t.isActive ? "有効" : "無効"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingId === t.id}
                          onClick={() =>
                            handleToggleActive(t.id, t.isActive)
                          }
                        >
                          {t.isActive ? "無効化" : "有効化"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(
                              expandedId === t.id ? null : t.id,
                            )
                          }
                        >
                          {expandedId === t.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr>
                      <td colSpan={6} className="bg-muted/30 px-4 py-3">
                        <TeacherAssignments
                          teacherId={t.id}
                          availableClasses={availableClasses}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

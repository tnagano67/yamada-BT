import { auth } from "@/lib/auth/auth";
import { redirect, notFound } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { canAccessStudent } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStudentDetail } from "@/lib/teacher/student-detail-service";
import { StudentGradeSummary } from "@/components/teacher/StudentGradeSummary";
import { StudentTestHistory } from "@/components/teacher/StudentTestHistory";
import { TeacherNotesList } from "@/components/teacher/TeacherNotesList";
import { AlertList } from "@/components/teacher/AlertList";
import { addTeacherNote, deleteTeacherNote } from "./actions";
import { acknowledgeAlertAction } from "../../alerts/actions";

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { studentId } = await params;

  const hasAccess = await canAccessStudent(
    session.user.id,
    session.user.role as UserRole,
    studentId,
  );
  if (!hasAccess) redirect("/teacher/dashboard");

  const detail = await getStudentDetail(studentId, session.user.id);
  if (!detail) notFound();

  async function handleAddNote(content: string) {
    "use server";
    await addTeacherNote(studentId, content);
  }

  async function handleDeleteNote(noteId: string) {
    "use server";
    await deleteTeacherNote(noteId);
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {detail.name ?? "名前未設定"}
        </h1>
        {detail.nameKana ? (
          <span className="text-muted-foreground text-sm">
            ({detail.nameKana})
          </span>
        ) : null}
        {detail.classInfo ? (
          <Badge variant="secondary">{detail.classInfo}</Badge>
        ) : null}
      </div>

      {/* グレード・ストリーク */}
      <div className="mb-6">
        <StudentGradeSummary
          englishGrade={detail.englishGrade}
          japaneseGrade={detail.japaneseGrade}
          streak={detail.streak}
        />
      </div>

      {/* テスト履歴 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>テスト履歴（直近10件）</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentTestHistory attempts={detail.recentAttempts} />
        </CardContent>
      </Card>

      {/* アラート */}
      {detail.alerts.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>未確認アラート</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertList
              alerts={detail.alerts.map((a) => ({
                ...a,
                severity: a.severity as "high" | "medium" | "low",
                student: {
                  id: detail.id,
                  name: detail.name,
                  nameKana: detail.nameKana,
                },
              }))}
              acknowledgeAction={acknowledgeAlertAction}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* 教員メモ */}
      <Card>
        <CardHeader>
          <CardTitle>教員メモ</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherNotesList
            notes={detail.notes}
            addNoteAction={handleAddNote}
            deleteNoteAction={handleDeleteNote}
          />
        </CardContent>
      </Card>
    </div>
  );
}

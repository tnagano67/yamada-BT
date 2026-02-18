import { auth } from "@/lib/auth/auth";
import { redirect, notFound } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { canAccessClass } from "@/lib/auth/authorize";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClassOverview,
  getGradeDistribution,
  getClassStudentList,
  getClassTestResults,
} from "@/lib/teacher/class-detail-service";
import { ClassDetailTabs } from "@/components/teacher/ClassDetailTabs";
import { GradeDistribution } from "@/components/teacher/GradeDistribution";
import { StudentListTable } from "@/components/teacher/StudentListTable";
import { TestResultsTable } from "@/components/teacher/TestResultsTable";

interface ClassDetailPageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { classId } = await params;

  const hasAccess = await canAccessClass(
    session.user.id,
    session.user.role as UserRole,
    classId,
  );
  if (!hasAccess) redirect("/teacher/dashboard");

  const [overview, engDistribution, jpDistribution, students, results] =
    await Promise.all([
      getClassOverview(classId),
      getGradeDistribution(classId, "english"),
      getGradeDistribution(classId, "japanese"),
      getClassStudentList(classId),
      getClassTestResults(classId),
    ]);

  if (!overview) notFound();

  const overviewContent = (
    <div className="space-y-6">
      {/* クラス情報 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">生徒数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本日の受験率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.todayAttendanceRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本日の平均正答率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {overview.todayAverageScore !== null
                ? `${overview.todayAverageScore}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">担任</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{overview.homeroomTeacher ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* グレード分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <GradeDistribution data={engDistribution} label="英語" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <GradeDistribution data={jpDistribution} label="日本語" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const studentsContent = <StudentListTable students={students} />;
  const resultsContent = <TestResultsTable results={results} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{overview.className}</h1>
      <ClassDetailTabs
        overview={overviewContent}
        students={studentsContent}
        results={resultsContent}
      />
    </div>
  );
}

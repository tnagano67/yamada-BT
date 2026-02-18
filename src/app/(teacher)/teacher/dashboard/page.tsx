import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getTeacherDailySummary,
  getRecentPromotions,
} from "@/lib/teacher/dashboard-service";
import { getAlertSummary } from "@/lib/alert/alert-service";
import { TodaySummaryCard } from "@/components/teacher/TodaySummaryCard";
import { OverallStatsCards } from "@/components/teacher/OverallStatsCards";
import { AlertSummaryCard } from "@/components/teacher/AlertSummaryCard";
import { ClassSummaryTable } from "@/components/teacher/ClassSummaryTable";
import { RecentPromotions } from "@/components/teacher/RecentPromotions";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacherId = session.user.id;

  const [summary, alertSummary, promotions] = await Promise.all([
    getTeacherDailySummary(teacherId),
    getAlertSummary(teacherId),
    getRecentPromotions(teacherId),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">教員ダッシュボード</h1>

      {/* 今日のサマリー */}
      <div className="mb-6">
        <TodaySummaryCard
          date={summary.date}
          hasActiveDelivery={summary.hasActiveDelivery}
          deliveryStatus={summary.deliveryStatus}
          totalTested={summary.totalTested}
          totalStudents={summary.totalStudents}
        />
      </div>

      {/* 統計カード 3列 */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <OverallStatsCards
          attendanceRate={summary.overallAttendanceRate}
          averageScore={summary.overallAverageScore}
        />
        <AlertSummaryCard
          high={alertSummary.high}
          medium={alertSummary.medium}
          low={alertSummary.low}
        />
      </div>

      {/* クラス一覧 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>クラス別受験状況</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassSummaryTable classes={summary.classes} />
        </CardContent>
      </Card>

      {/* 最近の昇格 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の昇格</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentPromotions promotions={promotions} />
        </CardContent>
      </Card>
    </div>
  );
}

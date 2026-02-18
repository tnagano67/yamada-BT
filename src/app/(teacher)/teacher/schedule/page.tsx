import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth/roles";
import {
  currentYearJST,
  currentMonthJST,
  currentAcademicYearJST,
  currentSemesterJST,
} from "@/lib/date-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyPatternForm } from "@/components/schedule/WeeklyPatternForm";
import { SuspensionList } from "@/components/schedule/SuspensionList";
import { AddSuspensionForm } from "@/components/schedule/AddSuspensionForm";
import { DeliveryCalendar } from "@/components/schedule/DeliveryCalendar";
import {
  getSchedulePatterns,
  getSuspensions,
  getCalendarMonth,
} from "@/lib/schedule/schedule-service";
import type { Subject } from "@/generated/prisma/client";

interface SchedulePageProps {
  searchParams: Promise<{
    subject?: string;
    year?: string;
    month?: string;
  }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, "subject_lead")) {
    redirect("/teacher/dashboard");
  }

  const params = await searchParams;
  const subject: Subject =
    params.subject === "japanese" ? "japanese" : "english";

  const calendarYear = params.year ? Number(params.year) : currentYearJST();
  const calendarMonth = params.month ? Number(params.month) : currentMonthJST();

  // 現在の年度・学期を推定（JST基準、4月始まり）
  const academicYear = currentAcademicYearJST();
  const semester = currentSemesterJST();

  // 並列フェッチ
  const [patterns, suspensions, calendarDays] = await Promise.all([
    getSchedulePatterns(academicYear, semester, subject),
    getSuspensions(academicYear, semester, subject),
    getCalendarMonth(calendarYear, calendarMonth, subject),
  ]);

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">配信スケジュール</h1>
        <div className="flex gap-2">
          <a
            href={`/teacher/schedule?subject=english`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              subject === "english"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            英語
          </a>
          <a
            href={`/teacher/schedule?subject=japanese`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              subject === "japanese"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            日本語
          </a>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <WeeklyPatternForm
            academicYear={academicYear}
            semester={semester}
            subject={subject}
            initialPatterns={patterns}
          />

          <SuspensionList suspensions={suspensions} />

          <AddSuspensionForm
            academicYear={academicYear}
            semester={semester}
            subject={subject}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <DeliveryCalendar
            days={calendarDays}
            year={calendarYear}
            month={calendarMonth}
            subject={subject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

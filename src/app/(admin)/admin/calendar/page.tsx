import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentYearJST, currentMonthJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import {
  getSchoolCalendarMonth,
  getSemesters,
} from "@/lib/calendar/calendar-service";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CalendarGrid } from "@/components/admin/CalendarGrid";
import { CalendarCsvImport } from "@/components/admin/CalendarCsvImport";
import { SemesterSettings } from "@/components/admin/SemesterSettings";

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function AdminCalendarPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const params = await searchParams;
  const year = params.year ? Number(params.year) : currentYearJST();
  const month = params.month ? Number(params.month) : currentMonthJST();

  const [entries, semesters] = await Promise.all([
    getSchoolCalendarMonth(year, month),
    getSemesters(year),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">学校カレンダー</h1>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
          <TabsTrigger value="semester">学期設定</TabsTrigger>
          <TabsTrigger value="csv">CSVインポート</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarGrid entries={entries} year={year} month={month} />
        </TabsContent>

        <TabsContent value="semester" className="mt-4">
          <SemesterSettings
            semesters={semesters}
            academicYear={year}
          />
        </TabsContent>

        <TabsContent value="csv" className="mt-4">
          <CalendarCsvImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

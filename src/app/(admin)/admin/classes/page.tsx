import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import { getClasses } from "@/lib/admin/class-service";
import { getTeachers } from "@/lib/admin/teacher-service";
import { ClassList } from "@/components/admin/ClassList";
import { CreateClassDialog } from "@/components/admin/CreateClassDialog";

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYear?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const params = await searchParams;
  const academicYear = params.academicYear
    ? Number(params.academicYear)
    : currentAcademicYearJST();

  const [classes, teachers] = await Promise.all([
    getClasses(academicYear),
    getTeachers(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">クラス管理</h1>
        <CreateClassDialog
          academicYear={academicYear}
          teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>
      <p className="text-muted-foreground mb-4">{academicYear}年度</p>
      <ClassList
        classes={classes}
        academicYear={academicYear}
        teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}

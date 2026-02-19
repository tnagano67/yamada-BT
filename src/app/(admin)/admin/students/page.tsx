import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentsPaginated } from "@/lib/admin/student-service";
import { getClasses } from "@/lib/admin/class-service";
import { getSetupStatus } from "@/lib/admin/setup-service";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/admin/pagination";
import { AdminStudentList } from "@/components/admin/AdminStudentList";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";
import { AdminStudentCsvImport } from "@/components/admin/AdminStudentCsvImport";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const academicYear = currentAcademicYearJST();
  const params = await searchParams;

  const [classes, setupStatus] = await Promise.all([
    getClasses(academicYear),
    getSetupStatus(academicYear),
  ]);

  if (!setupStatus.hasTeachers) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">生徒管理</h1>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">
                生徒を登録するには、先に教員を登録してください
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                教員→クラス→生徒の順に登録を進めてください。
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/teachers">教員管理へ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!setupStatus.hasClasses) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">生徒管理</h1>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">
                生徒を登録するには、先にクラスを登録してください
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                クラスを登録すると、生徒をクラスに所属させることができます。
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/classes">クラス管理へ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { page, pageSize, skip } = parsePaginationParams(params);

  const filter = {
    gradeYear: params.gradeYear ? Number(params.gradeYear) : undefined,
    className: params.className || undefined,
    status: params.status || undefined,
    unassigned: params.unassigned === "true",
    search: params.search || undefined,
  };

  const { students, totalCount } = await getStudentsPaginated(
    academicYear,
    filter,
    skip,
    pageSize,
  );

  const paginationMeta = buildPaginationMeta(page, pageSize, totalCount);

  const gradeYears = [...new Set(classes.map((c) => c.gradeYear))].sort();
  const classNames = [...new Set(classes.map((c) => c.className))].sort();

  const classesForDialog = classes.map((c) => ({
    id: c.id,
    gradeYear: c.gradeYear,
    className: c.className,
  }));

  const filters = {
    gradeYear: params.gradeYear ?? "",
    className: params.className ?? "",
    status: params.status ?? "",
    unassigned: params.unassigned ?? "",
    search: params.search ?? "",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">生徒管理</h1>
          <p className="text-muted-foreground text-sm">{academicYear}年度</p>
        </div>
        <div className="flex gap-2">
          <AdminStudentCsvImport academicYear={academicYear} />
          <AddStudentDialog classes={classesForDialog} />
        </div>
      </div>
      <AdminStudentList
        students={students}
        gradeYears={gradeYears}
        classNames={classNames}
        paginationMeta={paginationMeta}
        filters={filters}
      />
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getClassesPaginated } from "@/lib/admin/class-service";
import { getTeachers } from "@/lib/admin/teacher-service";
import { getSetupStatus } from "@/lib/admin/setup-service";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/admin/pagination";
import { ClassList } from "@/components/admin/ClassList";
import { CreateClassDialog } from "@/components/admin/CreateClassDialog";
import { ClassCsvImport } from "@/components/admin/ClassCsvImport";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{
    academicYear?: string;
    gradeYear?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const params = await searchParams;
  const academicYear = params.academicYear
    ? Number(params.academicYear)
    : currentAcademicYearJST();

  const gradeYearFilter = params.gradeYear ? Number(params.gradeYear) : undefined;
  const searchFilter = params.search || undefined;
  const { page, pageSize, skip } = parsePaginationParams(params);

  const [{ classes, totalCount }, teachers, setupStatus] = await Promise.all([
    getClassesPaginated(
      academicYear,
      { gradeYear: gradeYearFilter, search: searchFilter },
      skip,
      pageSize,
    ),
    getTeachers(),
    getSetupStatus(academicYear),
  ]);

  if (!setupStatus.hasTeachers) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">クラス管理</h1>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">
                クラスを登録するには、先に教員を登録してください
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                教員を登録すると、クラスの担任として割り当てることができます。
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

  const paginationMeta = buildPaginationMeta(page, pageSize, totalCount);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">クラス管理</h1>
        <div className="flex gap-2">
          <ClassCsvImport academicYear={academicYear} />
          <CreateClassDialog
            academicYear={academicYear}
            teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>
      </div>
      <p className="text-muted-foreground mb-4">{academicYear}年度</p>
      <ClassList
        classes={classes}
        academicYear={academicYear}
        teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
        paginationMeta={paginationMeta}
        filters={{
          gradeYear: params.gradeYear ?? "",
          search: params.search ?? "",
        }}
      />
    </div>
  );
}

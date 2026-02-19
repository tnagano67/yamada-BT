import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import {
  getTeachersPaginated,
  getTeacherStats,
} from "@/lib/admin/teacher-service";
import { getClasses } from "@/lib/admin/class-service";
import { TeacherList } from "@/components/admin/TeacherList";
import { AddTeacherDialog } from "@/components/admin/AddTeacherDialog";
import { TeacherCsvImport } from "@/components/admin/TeacherCsvImport";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/admin/pagination";

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
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
  const academicYear = currentAcademicYearJST();
  const { page, pageSize, skip } = parsePaginationParams(params);

  const filter: {
    role?: string;
    isActive?: boolean;
    search?: string;
  } = {};
  if (params.role) filter.role = params.role;
  if (params.status === "active") filter.isActive = true;
  if (params.status === "inactive") filter.isActive = false;
  if (params.search) filter.search = params.search;

  const [{ teachers, totalCount }, stats, classes] = await Promise.all([
    getTeachersPaginated(filter, skip, pageSize),
    getTeacherStats(),
    getClasses(academicYear),
  ]);

  const availableClasses = classes.map((c) => ({
    id: c.id,
    label: `${c.gradeYear}年${c.className}組`,
  }));

  const paginationMeta = buildPaginationMeta(page, pageSize, totalCount);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">教員管理</h1>
        <div className="flex gap-2">
          <TeacherCsvImport />
          <AddTeacherDialog />
        </div>
      </div>
      <TeacherList
        teachers={teachers}
        availableClasses={availableClasses}
        stats={stats}
        paginationMeta={paginationMeta}
        filters={{
          role: params.role ?? "",
          status: params.status ?? "",
          search: params.search ?? "",
        }}
      />
    </div>
  );
}

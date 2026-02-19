import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { getGradesPaginated } from "@/lib/admin/grade-service";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/admin/pagination";
import { GradeList } from "@/components/admin/GradeList";
import { AddGradeDialog } from "@/components/admin/AddGradeDialog";
import type { Subject } from "@/generated/prisma/client";

export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const params = await searchParams;
  const { page, pageSize, skip } = parsePaginationParams(params);

  const filter = {
    subject: (params.subject as Subject) || undefined,
    search: params.search || undefined,
  };

  const { grades, totalCount } = await getGradesPaginated(
    filter,
    skip,
    pageSize,
  );

  const paginationMeta = buildPaginationMeta(page, pageSize, totalCount);

  const filters = {
    subject: params.subject ?? "",
    search: params.search ?? "",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">グレード管理</h1>
        <AddGradeDialog />
      </div>
      <GradeList
        grades={grades}
        paginationMeta={paginationMeta}
        filters={filters}
      />
    </div>
  );
}

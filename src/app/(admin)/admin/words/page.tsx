import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { getWordsPaginated } from "@/lib/admin/word-service";
import { getAllGrades } from "@/lib/admin/grade-service";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/admin/pagination";
import { WordList } from "@/components/admin/WordList";
import { AddWordDialog } from "@/components/admin/AddWordDialog";
import { WordCsvImport } from "@/components/admin/WordCsvImport";
import type { Subject } from "@/generated/prisma/client";

export default async function AdminWordsPage({
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
    gradeId: params.gradeId || undefined,
    search: params.search || undefined,
  };

  const [{ words, totalCount }, grades] = await Promise.all([
    getWordsPaginated(filter, skip, pageSize),
    getAllGrades(),
  ]);

  const paginationMeta = buildPaginationMeta(page, pageSize, totalCount);

  const filters = {
    subject: params.subject ?? "",
    gradeId: params.gradeId ?? "",
    search: params.search ?? "",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">単語管理</h1>
        <div className="flex gap-2">
          <WordCsvImport />
          <AddWordDialog grades={grades} />
        </div>
      </div>
      <WordList
        words={words}
        grades={grades}
        paginationMeta={paginationMeta}
        filters={filters}
      />
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getStudentsByClass } from "@/lib/admin/class-service";
import { StudentList } from "@/components/admin/StudentList";
import { StudentCsvImport } from "@/components/admin/StudentCsvImport";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const { classId } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      homeroomTeacher: { select: { name: true } },
    },
  });

  if (!cls) {
    redirect("/admin/classes");
  }

  const students = await getStudentsByClass(classId);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/classes">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            クラス一覧に戻る
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {cls.gradeYear}年{cls.className}組
            </h1>
            <p className="text-muted-foreground">
              {cls.academicYear}年度
              {cls.homeroomTeacher
                ? ` / 担任: ${cls.homeroomTeacher.name}`
                : ""}
            </p>
          </div>
          <StudentCsvImport academicYear={cls.academicYear} />
        </div>
      </div>
      <StudentList students={students} />
    </div>
  );
}

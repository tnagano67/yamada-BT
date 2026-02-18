import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import { getTeachers } from "@/lib/admin/teacher-service";
import { getClasses } from "@/lib/admin/class-service";
import { TeacherList } from "@/components/admin/TeacherList";

export default async function AdminTeachersPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const academicYear = currentAcademicYearJST();

  const [teachers, classes] = await Promise.all([
    getTeachers(),
    getClasses(academicYear),
  ]);

  const availableClasses = classes.map((c) => ({
    id: c.id,
    label: `${c.gradeYear}年${c.className}組`,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">教員管理</h1>
      <TeacherList teachers={teachers} availableClasses={availableClasses} />
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import { getSetupStatus } from "@/lib/admin/setup-service";
import { SetupStatusPanel } from "@/components/admin/SetupStatus";
import { ResetDataDialog } from "@/components/admin/ResetDataDialog";

export default async function AdminSetupPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login");
  }

  const academicYear = currentAcademicYearJST();
  const status = await getSetupStatus(academicYear);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">年度初期設定</h1>
          <p className="text-muted-foreground text-sm">
            {academicYear}年度 — 教員→クラス→生徒の順に登録してください
          </p>
        </div>
        <ResetDataDialog />
      </div>
      <SetupStatusPanel status={status} />
    </div>
  );
}

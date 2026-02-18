import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getUnacknowledgedAlerts } from "@/lib/alert/alert-service";
import { AlertList } from "@/components/teacher/AlertList";
import { acknowledgeAlertAction, refreshAlertsAction } from "./actions";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alerts = await getUnacknowledgedAlerts(session.user.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">アラート</h1>
        <form action={refreshAlertsAction}>
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            アラート更新
          </button>
        </form>
      </div>

      <AlertList
        alerts={alerts.map((a) => ({
          ...a,
          createdAt: a.createdAt,
          student: {
            id: a.student.id,
            name: a.student.name,
            nameKana: a.student.nameKana,
          },
        }))}
        acknowledgeAction={acknowledgeAlertAction}
      />
    </div>
  );
}

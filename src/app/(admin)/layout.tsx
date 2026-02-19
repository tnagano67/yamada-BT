import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { currentAcademicYearJST } from "@/lib/date-utils";
import { getSetupStatus } from "@/lib/admin/setup-service";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const setupStatus = await getSetupStatus(currentAcademicYearJST());

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={session.user}
        sidebarContent={
          <Sidebar variant="admin" setupStatus={setupStatus} />
        }
      />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r md:block">
          <Sidebar variant="admin" setupStatus={setupStatus} />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

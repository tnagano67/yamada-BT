import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={session.user}
        sidebarContent={<Sidebar variant="admin" />}
      />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r md:block">
          <Sidebar variant="admin" />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

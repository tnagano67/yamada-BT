import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={session.user} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <TabBar />
    </div>
  );
}

import { auth, signIn } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    if (role === "admin") redirect("/admin/school");
    if (role === "teacher" || role === "subject_lead")
      redirect("/teacher/dashboard");
    redirect("/student/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">グレードアップ学習システム</CardTitle>
          <CardDescription>
            学校のGoogleアカウントでログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Googleアカウントでログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

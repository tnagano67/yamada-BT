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

const DEV_USERS = [
  { email: "admin@dev.local", label: "管理者", role: "admin" },
  { email: "teacher@dev.local", label: "教員", role: "teacher" },
  { email: "lead@dev.local", label: "教科主任", role: "subject_lead" },
  { email: "student@dev.local", label: "生徒", role: "student" },
] as const;

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    if (role === "admin") redirect("/admin/school");
    if (role === "teacher" || role === "subject_lead")
      redirect("/teacher/dashboard");
    redirect("/student/dashboard");
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">グレードアップ学習システム</CardTitle>
          <CardDescription>
            学校のGoogleアカウントでログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {isDev && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-center text-sm text-muted-foreground">
                開発用ログイン
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEV_USERS.map((user) => (
                  <form
                    key={user.email}
                    action={async () => {
                      "use server";
                      await signIn("dev-login", {
                        email: user.email,
                        redirectTo: "/",
                      });
                    }}
                  >
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {user.label}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

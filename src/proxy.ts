import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { UserRole } from "@/generated/prisma/client";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/cron"];

const ROUTE_ROLE_MAP: { prefix: string; minRole: UserRole }[] = [
  { prefix: "/admin", minRole: "admin" },
  { prefix: "/teacher", minRole: "teacher" },
  { prefix: "/student", minRole: "student" },
];

const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  subject_lead: 2,
  admin: 3,
};

function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  // Redirect unauthenticated users to login
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user.role;

  // Check route-level role requirements
  for (const route of ROUTE_ROLE_MAP) {
    if (pathname.startsWith(route.prefix)) {
      if (!hasMinRole(userRole, route.minRole)) {
        // Redirect to appropriate dashboard based on actual role
        const redirectPath =
          userRole === "admin"
            ? "/admin/school"
            : userRole === "teacher" || userRole === "subject_lead"
              ? "/teacher/dashboard"
              : "/student/dashboard";
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

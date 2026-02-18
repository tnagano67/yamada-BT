import type { UserRole } from "@/generated/prisma/client";
import { hasRole } from "./roles";
import { prisma } from "@/lib/db/prisma";

/**
 * URLパスに対するアクセス権を判定する
 */
export function canAccessRoute(userRole: UserRole, path: string): boolean {
  if (path.startsWith("/admin")) {
    return hasRole(userRole, "admin");
  }
  if (path.startsWith("/teacher")) {
    return hasRole(userRole, "teacher");
  }
  if (path.startsWith("/student")) {
    return hasRole(userRole, "student");
  }
  return true;
}

/**
 * 教員がクラスにアクセスできるか判定する
 * adminは全クラスアクセス可
 */
export async function canAccessClass(
  userId: string,
  userRole: UserRole,
  classId: string,
): Promise<boolean> {
  if (userRole === "admin") return true;

  if (!hasRole(userRole, "teacher")) return false;

  const assignment = await prisma.teacherClassAssignment.findFirst({
    where: { teacherId: userId, classId },
  });
  return assignment !== null;
}

/**
 * 教員が生徒にアクセスできるか判定する
 * adminは全生徒アクセス可
 */
export async function canAccessStudent(
  userId: string,
  userRole: UserRole,
  studentId: string,
): Promise<boolean> {
  if (userRole === "admin") return true;

  if (!hasRole(userRole, "teacher")) return false;

  // 教員の担当クラスに所属する生徒かチェック
  const count = await prisma.classStudent.count({
    where: {
      studentId,
      status: "active",
      class: {
        teacherAssignments: {
          some: { teacherId: userId },
        },
      },
    },
  });
  return count > 0;
}

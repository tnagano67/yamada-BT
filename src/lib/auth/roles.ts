import type { UserRole } from "@/generated/prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  subject_lead: 2,
  admin: 3,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isStudent(role: UserRole): boolean {
  return hasRole(role, "student");
}

export function isTeacher(role: UserRole): boolean {
  return hasRole(role, "teacher");
}

export function isSubjectLead(role: UserRole): boolean {
  return hasRole(role, "subject_lead");
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    student: "生徒",
    teacher: "教員",
    subject_lead: "教科主任",
    admin: "管理者",
  };
  return labels[role];
}

export function getDefaultRedirect(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/setup";
    case "subject_lead":
    case "teacher":
      return "/teacher/dashboard";
    default:
      return "/student/dashboard";
  }
}

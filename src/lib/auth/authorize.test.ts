import { describe, it, expect } from "vitest";
import { canAccessRoute } from "./authorize";
import type { UserRole } from "@/generated/prisma/client";

describe("canAccessRoute", () => {
  describe("student role", () => {
    const role: UserRole = "student";

    it("/student/* にアクセス可", () => {
      expect(canAccessRoute(role, "/student/dashboard")).toBe(true);
      expect(canAccessRoute(role, "/student/quiz")).toBe(true);
    });

    it("/teacher/* にアクセス不可", () => {
      expect(canAccessRoute(role, "/teacher/dashboard")).toBe(false);
      expect(canAccessRoute(role, "/teacher/alerts")).toBe(false);
    });

    it("/admin/* にアクセス不可", () => {
      expect(canAccessRoute(role, "/admin/setup")).toBe(false);
      expect(canAccessRoute(role, "/admin/classes")).toBe(false);
    });
  });

  describe("teacher role", () => {
    const role: UserRole = "teacher";

    it("/student/* にアクセス可", () => {
      expect(canAccessRoute(role, "/student/dashboard")).toBe(true);
    });

    it("/teacher/* にアクセス可", () => {
      expect(canAccessRoute(role, "/teacher/dashboard")).toBe(true);
      expect(canAccessRoute(role, "/teacher/alerts")).toBe(true);
    });

    it("/admin/* にアクセス不可", () => {
      expect(canAccessRoute(role, "/admin/setup")).toBe(false);
    });
  });

  describe("subject_lead role", () => {
    const role: UserRole = "subject_lead";

    it("/student/* にアクセス可", () => {
      expect(canAccessRoute(role, "/student/dashboard")).toBe(true);
    });

    it("/teacher/* にアクセス可", () => {
      expect(canAccessRoute(role, "/teacher/dashboard")).toBe(true);
    });

    it("/admin/* にアクセス不可", () => {
      expect(canAccessRoute(role, "/admin/setup")).toBe(false);
    });
  });

  describe("admin role", () => {
    const role: UserRole = "admin";

    it("/student/* にアクセス可", () => {
      expect(canAccessRoute(role, "/student/dashboard")).toBe(true);
    });

    it("/teacher/* にアクセス可", () => {
      expect(canAccessRoute(role, "/teacher/dashboard")).toBe(true);
    });

    it("/admin/* にアクセス可", () => {
      expect(canAccessRoute(role, "/admin/setup")).toBe(true);
      expect(canAccessRoute(role, "/admin/teachers")).toBe(true);
      expect(canAccessRoute(role, "/admin/classes")).toBe(true);
      expect(canAccessRoute(role, "/admin/calendar")).toBe(true);
    });
  });

  describe("public routes", () => {
    it("全ロールがpublicパスにアクセス可", () => {
      const roles: UserRole[] = ["student", "teacher", "subject_lead", "admin"];
      for (const role of roles) {
        expect(canAccessRoute(role, "/login")).toBe(true);
        expect(canAccessRoute(role, "/")).toBe(true);
      }
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  hasRole,
  isStudent,
  isTeacher,
  isSubjectLead,
  isAdmin,
  getRoleLabel,
  getDefaultRedirect,
} from "./roles";

describe("hasRole", () => {
  it("admin has all roles", () => {
    expect(hasRole("admin", "student")).toBe(true);
    expect(hasRole("admin", "teacher")).toBe(true);
    expect(hasRole("admin", "subject_lead")).toBe(true);
    expect(hasRole("admin", "admin")).toBe(true);
  });

  it("student only has student role", () => {
    expect(hasRole("student", "student")).toBe(true);
    expect(hasRole("student", "teacher")).toBe(false);
    expect(hasRole("student", "admin")).toBe(false);
  });

  it("teacher has student and teacher roles", () => {
    expect(hasRole("teacher", "student")).toBe(true);
    expect(hasRole("teacher", "teacher")).toBe(true);
    expect(hasRole("teacher", "subject_lead")).toBe(false);
  });

  it("subject_lead has student, teacher, and subject_lead roles", () => {
    expect(hasRole("subject_lead", "student")).toBe(true);
    expect(hasRole("subject_lead", "teacher")).toBe(true);
    expect(hasRole("subject_lead", "subject_lead")).toBe(true);
    expect(hasRole("subject_lead", "admin")).toBe(false);
  });
});

describe("role check helpers", () => {
  it("isStudent returns true for all roles", () => {
    expect(isStudent("student")).toBe(true);
    expect(isStudent("admin")).toBe(true);
  });

  it("isTeacher returns true for teacher and above", () => {
    expect(isTeacher("student")).toBe(false);
    expect(isTeacher("teacher")).toBe(true);
    expect(isTeacher("admin")).toBe(true);
  });

  it("isSubjectLead returns true for subject_lead and above", () => {
    expect(isSubjectLead("student")).toBe(false);
    expect(isSubjectLead("teacher")).toBe(false);
    expect(isSubjectLead("subject_lead")).toBe(true);
    expect(isSubjectLead("admin")).toBe(true);
  });

  it("isAdmin returns true only for admin", () => {
    expect(isAdmin("student")).toBe(false);
    expect(isAdmin("teacher")).toBe(false);
    expect(isAdmin("subject_lead")).toBe(false);
    expect(isAdmin("admin")).toBe(true);
  });
});

describe("getRoleLabel", () => {
  it("returns Japanese labels", () => {
    expect(getRoleLabel("student")).toBe("生徒");
    expect(getRoleLabel("teacher")).toBe("教員");
    expect(getRoleLabel("subject_lead")).toBe("教科主任");
    expect(getRoleLabel("admin")).toBe("管理者");
  });
});

describe("getDefaultRedirect", () => {
  it("returns correct redirect paths", () => {
    expect(getDefaultRedirect("student")).toBe("/student/dashboard");
    expect(getDefaultRedirect("teacher")).toBe("/teacher/dashboard");
    expect(getDefaultRedirect("subject_lead")).toBe("/teacher/dashboard");
    expect(getDefaultRedirect("admin")).toBe("/admin/school");
  });
});

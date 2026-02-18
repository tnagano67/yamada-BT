"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  BookOpen,
  Bell,
} from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const teacherItems: SidebarItem[] = [
  { href: "/teacher/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/teacher/students", label: "生徒管理", icon: Users },
  { href: "/teacher/results", label: "テスト結果", icon: BarChart3 },
  { href: "/teacher/schedule", label: "配信スケジュール", icon: Calendar },
  { href: "/teacher/alerts", label: "アラート", icon: Bell },
];

const adminItems: SidebarItem[] = [
  { href: "/admin/school", label: "学校管理", icon: Settings },
  { href: "/admin/teachers", label: "教員管理", icon: Users },
  { href: "/admin/classes", label: "クラス管理", icon: BookOpen },
  { href: "/admin/calendar", label: "カレンダー", icon: Calendar },
];

interface SidebarProps {
  variant: "teacher" | "admin";
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminItems : teacherItems;

  return (
    <nav className="flex flex-col gap-1 p-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-l-3 border-teal-600 bg-teal-50 text-teal-700"
                : "text-muted-foreground hover:bg-teal-50/50 hover:text-teal-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

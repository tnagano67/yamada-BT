"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Trophy, User } from "lucide-react";

const tabs = [
  { href: "/student/dashboard", label: "ホーム", icon: Home },
  { href: "/student/study", label: "学習", icon: BookOpen },
  { href: "/student/badges", label: "バッジ", icon: Trophy },
  { href: "/student/profile", label: "マイページ", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-teal-600"
                  : "text-muted-foreground hover:text-teal-600"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-teal-600" />
              )}
              <Icon className="h-6 w-6" />
              <span className={cn(isActive && "font-medium")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

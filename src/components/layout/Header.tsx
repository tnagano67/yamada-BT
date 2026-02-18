import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BookOpen } from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
  };
  sidebarContent?: React.ReactNode;
}

export function Header({ user, sidebarContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-teal-600 to-emerald-600 shadow-lg">
      <div className="flex h-14 items-center px-4">
        {sidebarContent && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 text-white hover:bg-white/20 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニュー</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-white" />
          <span className="font-bold text-white">グレードアップ</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

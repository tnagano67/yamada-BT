import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {sidebarContent && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニュー</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">グレードアップ</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

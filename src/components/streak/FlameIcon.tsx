"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlameIconProps {
  flameLevel: number;
  className?: string;
}

const levelStyles: Record<
  number,
  { color: string; size: string; animate?: string }
> = {
  0: { color: "text-muted-foreground", size: "h-5 w-5" },
  1: { color: "text-orange-300", size: "h-5 w-5" },
  2: { color: "text-orange-500", size: "h-6 w-6" },
  3: { color: "text-red-500", size: "h-7 w-7" },
  4: { color: "text-blue-500", size: "h-8 w-8", animate: "animate-pulse" },
  5: {
    color: "text-transparent bg-clip-text bg-gradient-to-t from-orange-500 via-red-500 to-purple-500",
    size: "h-9 w-9",
    animate: "animate-pulse",
  },
};

export function FlameIcon({ flameLevel, className }: FlameIconProps) {
  const level = Math.min(Math.max(flameLevel, 0), 5);
  const style = levelStyles[level];

  // Level 5 uses a special gradient stroke approach
  if (level === 5) {
    return (
      <Flame
        className={cn(
          style.size,
          style.animate,
          "text-purple-500",
          className,
        )}
        style={{
          filter: "drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))",
        }}
      />
    );
  }

  return (
    <Flame
      className={cn(style.color, style.size, style.animate, className)}
    />
  );
}

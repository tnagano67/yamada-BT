"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
}: SortableHeaderProps) {
  function handleClick() {
    if (currentSortKey !== sortKey) {
      onSort(sortKey, "asc");
    } else if (currentDirection === "asc") {
      onSort(sortKey, "desc");
    } else {
      onSort(sortKey, null);
    }
  }

  const isActive = currentSortKey === sortKey && currentDirection !== null;

  return (
    <button
      type="button"
      className="flex items-center gap-1 font-medium hover:text-foreground"
      onClick={handleClick}
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

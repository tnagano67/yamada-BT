"use client";

import { useSearchParams, usePathname } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "@/lib/admin/pagination";

interface PaginationBarProps {
  meta: PaginationMeta;
}

export function PaginationBar({ meta }: PaginationBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (meta.totalPages <= 1) return null;

  function buildHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  const { page, totalPages } = meta;

  // Generate page numbers to display
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious href={buildHref(page - 1)} />
          ) : (
            <PaginationPrevious
              className="pointer-events-none opacity-50"
              aria-disabled
            />
          )}
        </PaginationItem>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href={buildHref(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          {page < totalPages ? (
            <PaginationNext href={buildHref(page + 1)} />
          ) : (
            <PaginationNext
              className="pointer-events-none opacity-50"
              aria-disabled
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

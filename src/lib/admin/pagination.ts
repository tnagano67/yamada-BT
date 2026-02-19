export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  skip: number;
}

const DEFAULT_PAGE_SIZE = 50;

export function parsePaginationParams(searchParams: {
  page?: string;
  pageSize?: string;
}): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(100, Number(searchParams.pageSize) || DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    skip: (page - 1) * pageSize,
  };
}

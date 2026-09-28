import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/types/api";

/** Prev/next pager for server-paginated lists. Hidden when everything fits on one page. */
export function PaginationBar({
  meta,
  onPageChange,
  disabled,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-2 pt-2" aria-label="Pagination">
      <p className="text-muted-foreground text-sm">
        Page {meta.page} of {meta.totalPages}
        <span className="hidden sm:inline"> · {meta.totalItems} total</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}

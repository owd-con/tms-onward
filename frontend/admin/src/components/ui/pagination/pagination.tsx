import { Button } from "../button";
import clsx from "clsx";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import type { PaginationProps } from "./types";
import { memo, useMemo } from "react";

export const Pagination = memo(({
  currentPage,
  totalPages,
  onChange,
  className,
  ariaLabelledBy,
}: PaginationProps) => {
  const pages = useMemo(() => generatePages(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <nav
      className={clsx("flex items-center gap-1.5", className)}
      aria-label="Pagination"
      aria-labelledby={ariaLabelledBy}
    >
      <Button
        className="w-[30px] h-[30px] min-h-[30px] p-0 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
        aria-label="Go to previous page"
      >
        <MdChevronLeft className="w-5 h-5" aria-hidden="true" />
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <Button
            key={i}
            className="w-[30px] h-[30px] min-h-[30px] p-0 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 font-medium disabled:bg-white disabled:opacity-100 disabled:cursor-default"
            disabled
            aria-hidden="true"
          >
            ...
          </Button>
        ) : (
          <Button
            key={i}
            className={clsx("w-[30px] h-[30px] min-h-[30px] p-0 flex items-center justify-center rounded-md border text-[13px] font-medium transition-colors", {
              "border-gray-300 bg-white text-gray-800": page === currentPage,
              "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700": page !== currentPage,
            })}
            onClick={() => onChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        )
      )}

      <Button
        className="w-[30px] h-[30px] min-h-[30px] p-0 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === totalPages}
        onClick={() => onChange(currentPage + 1)}
        aria-label="Go to next page"
      >
        <MdChevronRight className="w-5 h-5" aria-hidden="true" />
      </Button>
    </nav>
  );
});

if (typeof Pagination.displayName !== "string") {
  Pagination.displayName = "Pagination";
}

// Simple page generator with ellipsis logic
const generatePages = (current: number, total: number): (number | "...")[] => {
  const pages: (number | "...")[] = [];
  const maxShown = 5;

  if (total <= maxShown) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    pages.push(1);

    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < total - 1) pages.push("...");

    pages.push(total);
  }

  return pages;
};

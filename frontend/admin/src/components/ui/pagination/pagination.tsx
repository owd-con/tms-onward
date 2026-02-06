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
  size = "md",
  ariaLabelledBy,
}: PaginationProps) => {
  const pages = useMemo(() => generatePages(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <nav
      className={clsx("join", className)}
      aria-label="Pagination"
      aria-labelledby={ariaLabelledBy}
    >
      <Button
        size={size}
        className="join-item"
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
            size={size}
            className="join-item"
            disabled
            aria-hidden="true"
          >
            ...
          </Button>
        ) : (
          <Button
            key={i}
            size={size}
            className={clsx("join-item", {
              "btn-active": page === currentPage,
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
        size={size}
        className="join-item"
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

import { Button } from "../button";
import clsx from "clsx";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import type { PaginationProps } from "./types";

export const Pagination = ({
  currentPage,
  totalPages,
  onChange,
  className,
  size = "md",
}: PaginationProps) => {
  const pages = generatePages(currentPage, totalPages);

  return (
    <div className={clsx("join", className)}>
      <Button
        size={size}
        className="join-item"
        disabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
      >
        <MdChevronLeft className="w-5 h-5" />
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <Button key={i} size={size} className="join-item" disabled>
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
      >
        <MdChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

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

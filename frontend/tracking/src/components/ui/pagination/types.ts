import type { ButtonSize } from "../button/types";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
  size?: ButtonSize;
}

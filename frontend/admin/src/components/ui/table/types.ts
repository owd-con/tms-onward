import type { ReactNode } from "react";

type SortDirection = "asc" | "desc";

type TableColumn<T> = {
  label: string;
  accessor: keyof T;
  sortable?: boolean;
  headerClass?: string;
  class?: string;
  render?: (row: T) => ReactNode;
};

type TableSort<T> = {
  accessor: keyof T;
  direction: SortDirection;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort?: (accessor: keyof T, direction: SortDirection) => void;
  sort?: TableSort<T>;
  className?: string;
  caption?: string;
};

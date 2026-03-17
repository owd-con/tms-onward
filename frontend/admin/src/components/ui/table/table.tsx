import clsx from "clsx";
import { memo } from "react";
import { Pagination } from "@/components";
import type { TableProps } from "./types";

export const Table = memo(<T,>({
  columns,
  data,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onSort,
  sort,
  className,
  caption,
}: TableProps<T>) => {
  const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx("w-full overflow-x-auto rounded-lg border border-gray-200 bg-white", className)}>
      <table
        className="table table-pin-rows table-pin-cols min-w-full"
        aria-busy={loading}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr className="border-b border-gray-200">
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={clsx(
                  "text-sm font-semibold",
                  col.sortable && "cursor-pointer hover:bg-base-300",
                  col.headerClass
                )}
                onClick={() => {
                  if (!col.sortable || !onSort) return;
                  const direction =
                    sort?.accessor === col.accessor && sort?.direction === "asc"
                      ? "desc"
                      : "asc";
                  onSort(col.accessor, direction);
                }}
                aria-sort={
                  col.sortable && sort?.accessor === col.accessor
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {col.label}
                {col.sortable && (
                  <span className="ml-1" aria-hidden="true">
                    {sort?.accessor === col.accessor
                      ? sort.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "⇅"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="text-center py-6" aria-live="polite" aria-busy="true">
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="text-center py-6">No data found.</div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-b-0">
                {columns.map((col, j) => (
                  <td key={j} className={clsx("text-sm", col.class)}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.accessor as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4 px-2 text-sm" aria-live="polite">
        <div id={`${tableId}-info`}>
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <Pagination
          currentPage={page}
          totalPages={total}
          onChange={onPageChange}
          ariaLabelledBy={`${tableId}-info`}
        />
      </div>
    </div>
  );
});

if (typeof Table.displayName !== "string") {
  Table.displayName = "Table";
}

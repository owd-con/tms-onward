import clsx from "clsx";
import { Pagination } from "@/components";
import type { TableProps } from "./types";

export const Table = <T,>({
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
}: TableProps<T>) => {
  return (
    <div className={clsx("w-full overflow-x-auto", className)}>
      <table className="table table-zebra table-pin-rows table-pin-cols min-w-full">
        <thead className="bg-base-200 sticky top-0 z-10">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={clsx("text-sm font-semibold", col.headerClass)}
                onClick={() => {
                  if (!col.sortable || !onSort) return;
                  const direction =
                    sort?.accessor === col.accessor && sort?.direction === "asc"
                      ? "desc"
                      : "asc";
                  onSort(col.accessor, direction);
                }}
              >
                {col.label}
                {col.sortable && (
                  <span className="ml-1">
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
                <div className="text-center py-6">Loading...</div>
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
              <tr key={i}>
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

      <div className="flex items-center justify-between mt-4 px-2 text-sm">
        <div>
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <Pagination
          currentPage={page}
          totalPages={total}
          onChange={onPageChange}
        />
      </div>
    </div>
  );
};

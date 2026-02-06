import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../services/store";
import { Pagination } from "../pagination";

interface PaginationProps {
  name: string;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
  pageLimit?: number[];
}

const TablePagination: React.FC<PaginationProps> = ({
  name,
  onChangePage,
  onChangeLimit,
  pageLimit = [25, 50, 100, 200],
}) => {
  const StateLimit = useSelector(
    (state: RootState) => state?.table?.data[name]?.limit
  );
  const StateTotal = useSelector(
    (state: RootState) => state?.table?.data[name]?.total
  );
  const StateCurrentPage = useSelector(
    (state: RootState) => state?.table?.data[name]?.page
  );

  // Calculate number of pages using useMemo instead of useState + useEffect
  // This prevents infinite loops from state updates
  const numberOfPages = React.useMemo(() => {
    if (!StateTotal || !StateLimit) return 1;
    const totalPages = Math.ceil(StateTotal / StateLimit);
    return totalPages < 1 ? 1 : totalPages;
  }, [StateTotal, StateLimit]);

  const changedPage = React.useCallback(
    (i: number) => {
      if (StateCurrentPage === i) return;
      onChangePage(i);
    },
    [StateCurrentPage, onChangePage]
  );

  const changedLimit = React.useCallback(
    (i: number) => {
      if (StateLimit === i) return;
      onChangeLimit(i);
    },
    [StateLimit, onChangeLimit]
  );

  const range = React.useMemo(() => {
    if (!StateTotal || !StateLimit || !StateCurrentPage) return "0 - 0";
    const first_num = (StateCurrentPage - 1) * StateLimit + 1;
    const last_num = Math.min(StateTotal, StateCurrentPage * StateLimit);
    return `${first_num} - ${last_num}`;
  }, [StateCurrentPage, StateLimit, StateTotal]);

  return (
    <div className="border-base-200 bg-base-100 mt-4 flex min-h-[62px] w-full flex-col items-center justify-between gap-4 border-t p-4 md:flex-row">
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold">{range}</span> of{" "}
        <span className="font-semibold">{StateTotal}</span> results
      </div>

      <div className="relative flex items-center gap-2">
        <Pagination
          size="sm"
          currentPage={StateCurrentPage}
          totalPages={numberOfPages}
          onChange={(page: number) => changedPage(page)}
        />

        {/* Dropdown limit */}
        <div className="dropdown dropdown-top dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-soft text-sm font-thin btn-sm"
          >
            {StateLimit} / page
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 w-52 p-2 shadow-sm"
          >
            {pageLimit.map((limit) => (
              <li key={limit}>
                <a onClick={() => changedLimit(limit)}>{limit} / page</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;

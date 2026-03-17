import React from "react";
import { useSelector } from "react-redux";
import { FiChevronDown } from "react-icons/fi";
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
  pageLimit = [8, 10, 25, 50, 100],
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

  const showingCount = React.useMemo(() => {
    if (!StateTotal || !StateLimit) return 0;
    const remaining = StateTotal - ((StateCurrentPage || 1) - 1) * StateLimit;
    return Math.min(StateLimit, Math.max(0, remaining));
  }, [StateTotal, StateLimit, StateCurrentPage]);

  return (
    <div className="border border-gray-200 border-t-0 bg-white min-h-[60px] w-full grid grid-cols-1 xl:grid-cols-3 items-center px-6 py-4 rounded-b-xl gap-4 xl:gap-0">
      
      {/* Left: Showing Count & Limit */}
      <div className="flex items-center gap-4 justify-center xl:justify-start">
        <div className="text-[13px] text-gray-500 font-medium">
          Showing&nbsp;<span className="font-semibold text-[#59A7CE]">{showingCount}</span>&nbsp;of {StateTotal} {name}
        </div>
      </div>

      {/* Center: Pagination Buttons */}
      <div className="flex justify-center">
        <Pagination
          currentPage={StateCurrentPage}
          totalPages={numberOfPages}
          onChange={(page: number) => changedPage(page)}
        />
      </div>

      {/* Right: Limit Dropdown */}
      <div className="flex items-center justify-center xl:justify-end gap-2 text-[13px] text-gray-500 font-medium">
        <div className="dropdown dropdown-top dropdown-end">
          <div 
            tabIndex={0} 
            role="button" 
            className="flex items-center justify-between gap-3 border border-gray-200 bg-white text-[13px] font-medium text-gray-600 rounded-md py-1.5 px-3 hover:bg-gray-50 transition-colors"
          >
            Show {StateLimit} Row
            <FiChevronDown className="text-gray-400 w-3.5 h-3.5" />
          </div>
          <ul 
            tabIndex={0} 
            className="dropdown-content z-50 menu p-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] bg-white rounded-lg w-36 border border-gray-100 mb-2"
          >
            {pageLimit.map(limit => (
              <li key={limit}>
                <a 
                  className={`text-[13px] py-1.5 px-3 rounded-md mb-0.5 last:mb-0 ${StateLimit === limit ? "bg-[#59A7CE]/10 text-[#59A7CE] font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                  onClick={() => {
                    changedLimit(limit);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                >
                  Show {limit} Row
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default TablePagination;

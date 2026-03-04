import { useMemo, useState } from "react";

import TableFilters from "@/components/ui/table/filter";

// TableFilter props: accept any filter shape
type ExceptionFilters = {
  customer_id?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<ExceptionFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<ExceptionFilters>;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  const [dateFrom, setDateFrom] = useState(current.date_from || "");
  const [dateTo, setDateTo] = useState(current.date_to || "");

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    table.filter({
      date_from: "",
      date_to: "",
    });
  };

  const handleFilter = () => {
    table.filter({
      date_from: dateFrom,
      date_to: dateTo,
    });
  };

  const isDirty = useMemo(() => {
    const currentDateFrom = current.date_from ?? "";
    const currentDateTo = current.date_to ?? "";

    return (
      dateFrom !== currentDateFrom ||
      dateTo !== currentDateTo
    );
  }, [dateFrom, dateTo, current]);

  const anyActive = !!(
    current.date_from ||
    current.date_to
  );

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
            Date From
          </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
            Date To
          </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
    </TableFilters>
  );
};

export default TableFilter;

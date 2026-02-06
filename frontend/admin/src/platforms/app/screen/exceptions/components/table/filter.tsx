import { useMemo, useState } from "react";

import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";

// TableFilter props: accept any filter shape
type ExceptionFilters = {
  reschedule_status?: string;
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

const rescheduleStatusOptions = [
  { label: "All Status", value: "" },
  { label: "Failed", value: "Failed" },
  { label: "Pending Reschedule", value: "Pending_Reschedule" },
  { label: "Rescheduled", value: "Rescheduled" },
  { label: "Cancelled", value: "Cancelled" },
];

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Initialize state from current filter values
  const [rescheduleStatus, setRescheduleStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.reschedule_status;
    return value
      ? rescheduleStatusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [dateFrom, setDateFrom] = useState(current.date_from || "");
  const [dateTo, setDateTo] = useState(current.date_to || "");

  const handleClear = () => {
    setRescheduleStatus(null);
    setDateFrom("");
    setDateTo("");
    table.filter({
      reschedule_status: "",
      date_from: "",
      date_to: "",
    });
  };

  const handleFilter = () => {
    table.filter({
      reschedule_status: rescheduleStatus?.value ? String(rescheduleStatus.value) : "",
      date_from: dateFrom,
      date_to: dateTo,
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.reschedule_status ?? "";
    const newStatus = rescheduleStatus?.value ? String(rescheduleStatus.value) : "";
    const currentDateFrom = current.date_from ?? "";
    const currentDateTo = current.date_to ?? "";

    return (
      newStatus !== currentStatus ||
      dateFrom !== currentDateFrom ||
      dateTo !== currentDateTo
    );
  }, [rescheduleStatus, dateFrom, dateTo, current]);

  const anyActive = !!(
    current.reschedule_status ||
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
            Reschedule Status
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={String(rescheduleStatus?.value ?? "")}
            onChange={(e) => {
              const value = e.target.value;
              setRescheduleStatus(
                rescheduleStatusOptions.find((opt) => opt.value === value) ?? null
              );
            }}
          >
            {rescheduleStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

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

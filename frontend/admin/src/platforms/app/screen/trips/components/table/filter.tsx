import { useMemo, useState } from "react";

import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";

// TableFilter props: accept any filter shape
type TripFilters = {
  status?: string;
  driver_id?: string;
  vehicle_id?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<TripFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<TripFilters>;
    };
  };
}

const tripStatusOptions = [
  { label: "All Status", value: "" },
  { label: "Planned", value: "Planned" },
  { label: "Dispatched", value: "Dispatched" },
  { label: "In Transit", value: "In_Transit" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? tripStatusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const handleClear = () => {
    setStatus(null);
    table.filter({ status: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    return newStatus !== currentStatus;
  }, [status, current.status]);

  const anyActive = !!current.status;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
            Status
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={String(status?.value ?? "")}
            onChange={(e) => {
              const value = e.target.value;
              setStatus(
                tripStatusOptions.find((opt) => opt.value === value) ?? null
              );
            }}
          >
            {tripStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </TableFilters>
  );
};

export default TableFilter;

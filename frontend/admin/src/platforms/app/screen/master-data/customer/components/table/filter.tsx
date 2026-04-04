import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import { FiChevronDown } from "react-icons/fi";
import type { SelectOptionValue } from "@/shared/types";
import { statusOptions } from "@/shared/options";

// TableFilter props: accept any filter shape
type CommonFilters = {
  status?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<CommonFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<CommonFilters>;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? statusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const handleFilterChange = (val: any) => {
    table.filter({
      status: val?.value ? String(val.value) : "",
    });
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-40 md:w-52">
        <RemoteSelect<SelectOptionValue>
          placeholder="Status: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={statusOptions}
          value={status}
          onChange={(val) => {
            setStatus(val);
            handleFilterChange(val);
          }}
          onClear={() => {
            setStatus(null);
            handleFilterChange(null);
          }}
          getLabel={(item) => item ? `Status: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </div>
  );
};

export default TableFilter;

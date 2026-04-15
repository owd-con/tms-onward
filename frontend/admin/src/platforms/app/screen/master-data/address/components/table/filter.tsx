import { useState } from "react";

import { RemoteSelect } from "@/components";
import { FiChevronDown } from "react-icons/fi";
import type { SelectOptionValue } from "@/shared/types";
import { statusOptions } from "@/shared/options";

// TableFilter props: accept any filter shape
type CommonFilters = {
  status?: string;
  address_type?: string;
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
  const addressTypeOptions = [
    { label: "All Types", value: "" },
    { label: "Pickup Point", value: "pickup_point" },
    { label: "Delivery Point", value: "drop_point" },
  ];

  const current = table.State?.filter ?? {};

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? (statusOptions.find((opt) => opt.value === value) ?? null)
      : null;
  });

  const [addressType, setAddressType] = useState<SelectOptionValue | null>(() => {
    const value = current.address_type;
    return value
      ? (addressTypeOptions.find((opt) => opt.value === value) ?? null)
      : null;
  });

  const handleFilterChange = (key: string, val: any) => {
    table.filter({
      status: key === "status" ? (val?.value ? String(val.value) : "") : (status?.value ? String(status.value) : ""),
      address_type: key === "addressType" ? (val?.value ? String(val.value) : "") : (addressType?.value ? String(addressType.value) : ""),
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
            handleFilterChange("status", val);
          }}
          onClear={() => {
            setStatus(null);
            handleFilterChange("status", null);
          }}
          getLabel={(item) => item ? `Status: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>
      <div className="w-40 md:w-52">
        <RemoteSelect<SelectOptionValue>
          placeholder="Type: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={addressTypeOptions}
          value={addressType}
          onChange={(val) => {
            setAddressType(val);
            handleFilterChange("addressType", val);
          }}
          onClear={() => {
            setAddressType(null);
            handleFilterChange("addressType", null);
          }}
          getLabel={(item) => item ? `Type: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </div>
  );
};

export default TableFilter;
import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import { FiChevronDown } from "react-icons/fi";
import type { SelectOptionValue } from "@/shared/types";
import {
  statusOptions,
  licenseTypeOptions as baseLicenseTypeOptions,
} from "@/shared/options";

// TableFilter props: accept any filter shape
type CommonFilters = {
  status?: string;
  license_type?: string;
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
  // Map base license type options to filter-friendly labels
  const licenseTypeOptions = useMemo(() => {
    return baseLicenseTypeOptions.map((opt) =>
      opt.value === ""
        ? { ...opt, label: "All Types" } // Override label for empty value in filter context
        : opt,
    );
  }, []);

  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter],
  );

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? (statusOptions.find((opt) => opt.value === value) ?? null)
      : null;
  });

  const [licenseType, setLicenseType] = useState<SelectOptionValue | null>(
    () => {
      const value = current.license_type;
      return value
        ? (licenseTypeOptions.find((opt) => opt.value === value) ?? null)
        : null;
    },
  );

  const handleFilterChange = (key: string, val: any) => {
    table.filter({
      status: key === "status" ? (val?.value ? String(val.value) : "") : (status?.value ? String(status.value) : ""),
      license_type: key === "licenseType" ? (val?.value ? String(val.value) : "") : (licenseType?.value ? String(licenseType.value) : ""),
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
          placeholder="License: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={licenseTypeOptions}
          value={licenseType}
          onChange={(val) => {
            setLicenseType(val);
            handleFilterChange("licenseType", val);
          }}
          onClear={() => {
            setLicenseType(null);
            handleFilterChange("licenseType", null);
          }}
          getLabel={(item) => item ? `License: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </div>
  );
};

export default TableFilter;

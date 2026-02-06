import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
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
  // State can differ from current until user clicks "Apply Filter"
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

  const handleClear = () => {
    setStatus(null);
    setLicenseType(null);
    table.filter({ status: "", license_type: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      license_type: licenseType?.value ? String(licenseType.value) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const currentLicenseType = current.license_type ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const newLicenseType = licenseType?.value ? String(licenseType.value) : "";

    return newStatus !== currentStatus || newLicenseType !== currentLicenseType;
  }, [status, licenseType, current.status, current.license_type]);

  const anyActive = !!current.status || !!current.license_type;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
        <RemoteSelect<SelectOptionValue>
          label='Status'
          placeholder='Filter Status'
          data={statusOptions}
          value={status}
          onChange={(opt) => setStatus(opt)}
          onClear={() => setStatus(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />

        <RemoteSelect<SelectOptionValue>
          label='License Type'
          placeholder='Filter License Type'
          data={licenseTypeOptions}
          value={licenseType}
          onChange={(opt) => setLicenseType(opt)}
          onClear={() => setLicenseType(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </TableFilters>
  );
};

export default TableFilter;

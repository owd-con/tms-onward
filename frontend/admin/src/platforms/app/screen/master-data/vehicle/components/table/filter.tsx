import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";
import { statusOptions, vehicleTypeOptions as baseVehicleTypeOptions } from "@/shared/options";

// TableFilter props: accept any filter shape
type CommonFilters = {
  status?: string;
  vehicle_type?: string;
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
  // Map base vehicle type options to filter-friendly labels
  const vehicleTypeOptions = useMemo(() => {
    return baseVehicleTypeOptions.map((opt) =>
      opt.value === ""
        ? { ...opt, label: "All Types" } // Override label for empty value in filter context
        : opt
    );
  }, []);

  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Initialize state from current filter values
  // State can differ from current until user clicks "Apply Filter"
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? statusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [vehicleType, setVehicleType] = useState<SelectOptionValue | null>(
    () => {
      const value = current.vehicle_type;
      return value
        ? vehicleTypeOptions.find((opt) => opt.value === value) ?? null
        : null;
    }
  );

  const handleClear = () => {
    setStatus(null);
    setVehicleType(null);
    table.filter({ status: "", vehicle_type: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      vehicle_type: vehicleType?.value ? String(vehicleType.value) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const currentVehicleType = current.vehicle_type ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const newVehicleType = vehicleType?.value ? String(vehicleType.value) : "";

    return (
      newStatus !== currentStatus || newVehicleType !== currentVehicleType
    );
  }, [status, vehicleType, current.status, current.vehicle_type]);

  const anyActive = !!current.status || !!current.vehicle_type;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RemoteSelect<SelectOptionValue>
          label="Status"
          placeholder="Filter Status"
          data={statusOptions}
          value={status}
          onChange={(opt) => setStatus(opt)}
          onClear={() => setStatus(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />

        <RemoteSelect<SelectOptionValue>
          label="Vehicle Type"
          placeholder="Filter Vehicle Type"
          data={vehicleTypeOptions}
          value={vehicleType}
          onChange={(opt) => setVehicleType(opt)}
          onClear={() => setVehicleType(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </TableFilters>
  );
};

export default TableFilter;

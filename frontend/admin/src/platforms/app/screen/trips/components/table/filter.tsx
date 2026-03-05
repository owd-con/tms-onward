import { useMemo, useState, useEffect } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";
import { tripStatusOptions } from "@/shared/options";
import { useDriver } from "@/services/driver/hooks";
import { useVehicle } from "@/services/vehicle/hooks";

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

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Fetch drivers & vehicles for filter
  const { get: getDrivers, getResult: getDriverResult } = useDriver();
  const { get: getVehicles, getResult: getVehicleResult } = useVehicle();

  useEffect(() => {
    getDrivers({ page: 1, limit: 100, status: "active" });
    getVehicles({ page: 1, limit: 100, status: "active" });
  }, []);

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? tripStatusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [driver, setDriver] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);

  // Sync driver state when current.driver_id changes
  useEffect(() => {
    if (current.driver_id && getDriverResult?.data?.data) {
      const drivers = getDriverResult.data.data as any[];
      const foundDriver = drivers.find((d) => d.id === current.driver_id);
      if (foundDriver) {
        setDriver(foundDriver);
      }
    } else if (!current.driver_id) {
      setDriver(null);
    }
  }, [current.driver_id, getDriverResult?.data?.data]);

  // Sync vehicle state when current.vehicle_id changes
  useEffect(() => {
    if (current.vehicle_id && getVehicleResult?.data?.data) {
      const vehicles = getVehicleResult.data.data as any[];
      const foundVehicle = vehicles.find((v) => v.id === current.vehicle_id);
      if (foundVehicle) {
        setVehicle(foundVehicle);
      }
    } else if (!current.vehicle_id) {
      setVehicle(null);
    }
  }, [current.vehicle_id, getVehicleResult?.data?.data]);

  const handleClear = () => {
    setStatus(null);
    setDriver(null);
    setVehicle(null);
    table.filter({ status: "", driver_id: "", vehicle_id: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      driver_id: driver?.id ? String(driver.id) : "",
      vehicle_id: vehicle?.id ? String(vehicle.id) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const currentDriver = current.driver_id ?? "";
    const newDriver = driver?.id ? String(driver.id) : "";
    const currentVehicle = current.vehicle_id ?? "";
    const newVehicle = vehicle?.id ? String(vehicle.id) : "";

    return newStatus !== currentStatus || newDriver !== currentDriver || newVehicle !== currentVehicle;
  }, [status, driver, vehicle, current.status, current.driver_id, current.vehicle_id]);

  const anyActive = !!current.status || !!current.driver_id || !!current.vehicle_id;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RemoteSelect
            label="Vehicle"
            placeholder="All Vehicles"
            value={vehicle}
            onChange={setVehicle}
            onClear={() => setVehicle(null)}
            fetchData={(page, search) =>
              getVehicles({ page: page || 1, limit: 20, search, status: "active" })
            }
            hook={getVehicleResult as any}
            getLabel={(item: any) => item.plate_number}
            getValue={(item: any) => item.id}
          />
          <RemoteSelect
            label="Driver"
            placeholder="All Drivers"
            value={driver}
            onChange={setDriver}
            onClear={() => setDriver(null)}
            fetchData={(page, search) =>
              getDrivers({ page: page || 1, limit: 20, search, status: "active" })
            }
            hook={getDriverResult as any}
            getLabel={(item: any) => item.name}
            getValue={(item: any) => item.id}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RemoteSelect<SelectOptionValue>
            label="Status"
            placeholder="All Status"
            data={tripStatusOptions}
            value={status}
            onChange={setStatus}
            onClear={() => setStatus(null)}
            getLabel={(item) => item?.label ?? ""}
            renderItem={(item) => item?.label}
          />
        </div>
      </div>
    </TableFilters>
  );
};

export default TableFilter;

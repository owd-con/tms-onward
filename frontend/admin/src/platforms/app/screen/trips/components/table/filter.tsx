import { useMemo, useState, useEffect } from "react";

import { RemoteSelect } from "@/components";
import { FiChevronDown } from "react-icons/fi";
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

  const handleFilterChange = (key: string, val: any) => {
    table.filter({
      status: key === "status" ? (val?.value ? String(val.value) : "") : (status?.value ? String(status.value) : ""),
      driver_id: key === "driver" ? (val?.id ? String(val.id) : "") : (driver?.id ? String(driver.id) : ""),
      vehicle_id: key === "vehicle" ? (val?.id ? String(val.id) : "") : (vehicle?.id ? String(vehicle.id) : ""),
    });
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-40 md:w-52">
        <RemoteSelect<SelectOptionValue>
          placeholder="Status: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={tripStatusOptions}
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
      <div className="w-40 md:w-56">
        <RemoteSelect
          placeholder="Driver: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          value={driver}
          onChange={(val) => {
            setDriver(val);
            handleFilterChange("driver", val);
          }}
          onClear={() => {
            setDriver(null);
            handleFilterChange("driver", null);
          }}
          fetchData={(page, search) =>
            getDrivers({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={getDriverResult as any}
          getLabel={(item: any) => item ? `Driver: ${item.name}` : ""}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>
      <div className="w-40 md:w-56">
        <RemoteSelect
          placeholder="Vehicle: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          value={vehicle}
          onChange={(val) => {
            setVehicle(val);
            handleFilterChange("vehicle", val);
          }}
          onClear={() => {
            setVehicle(null);
            handleFilterChange("vehicle", null);
          }}
          fetchData={(page, search) =>
            getVehicles({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={getVehicleResult as any}
          getLabel={(item: any) => item ? `Vehicle: ${item.plate_number}` : ""}
          renderItem={(item: any) => item?.plate_number}
          getValue={(item: any) => item.id}
        />
      </div>
    </div>
  );
};

export default TableFilter;

import { memo, useEffect, useState } from "react";
import type { Driver, Vehicle } from "@/services/types";
import { RemoteSelect } from "@/components";
import { useDriver } from "@/services/driver/hooks";
import { useVehicle } from "@/services/vehicle/hooks";
import type { RemoteMetaBase } from "@/components/ui/select-remote/types";

interface DriverVehicleSelection {
  driver?: Driver | null;
  vehicle?: Vehicle | null;
}

interface DriverVehicleSelectorProps {
  value?: DriverVehicleSelection;
  onChange?: (selection: DriverVehicleSelection) => void;
  errorDriver?: string;
  errorVehicle?: string;
  disabled?: boolean;
  excludeDriverIds?: string[];
  excludeVehicleIds?: string[];
}

/**
 * TMS Onward - Driver & Vehicle Selector Component
 *
 * Component untuk memilih driver dan vehicle yang aktif
 * untuk Direct Assignment (Trip creation)
 *
 * Features:
 * - Filter hanya driver & vehicle yang aktif
 * - Exclude driver/vehicle yang sudah ditugaskan (opsional)
 * - Menampilkan detail driver & vehicle yang dipilih
 */
export const DriverVehicleSelector = memo(({
  value,
  onChange,
  errorDriver,
  errorVehicle,
  disabled = false,
  excludeDriverIds: _excludeDriverIds = [],
  excludeVehicleIds: _excludeVehicleIds = [],
}: DriverVehicleSelectorProps) => {
  // State untuk selected driver & vehicle
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Driver & Vehicle hooks
  const {
    get: getDrivers,
    getResult: getDriversResult,
  } = useDriver();

  const {
    get: getVehicles,
    getResult: getVehiclesResult,
  } = useVehicle();

  // Initial fetch
  useEffect(() => {
    getDrivers({
      status: "active",
      limit: 100,
    });
    getVehicles({
      status: "active",
      limit: 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with external value
  useEffect(() => {
    if (value?.driver) {
      setSelectedDriver(value.driver);
    }
  }, [value?.driver]);

  useEffect(() => {
    if (value?.vehicle) {
      setSelectedVehicle(value.vehicle);
    }
  }, [value?.vehicle]);

  const handleDriverChange = (driver: Driver | null) => {
    setSelectedDriver(driver);
    onChange?.({
      driver,
      vehicle: selectedVehicle,
    });
  };

  const handleVehicleChange = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    onChange?.({
      driver: selectedDriver,
      vehicle,
    });
  };

  // Type casting for RemoteSelect compatibility
  // PaginatedResponse has structure { data: T[], meta: PaginationMeta }
  // RemoteSelect expects PaginatedPayload<T, M> with structure { data: T[], meta: M }
  // These are compatible, we just need to cast the meta field
  const driversResult = getDriversResult?.data
    ? {
        ...getDriversResult,
        data: getDriversResult.data.data ? {
          data: getDriversResult.data.data,
          meta: getDriversResult.data.meta as RemoteMetaBase,
        } : undefined,
      }
    : getDriversResult;

  const vehiclesResult = getVehiclesResult?.data
    ? {
        ...getVehiclesResult,
        data: getVehiclesResult.data.data ? {
          data: getVehiclesResult.data.data,
          meta: getVehiclesResult.data.meta as RemoteMetaBase,
        } : undefined,
      }
    : getVehiclesResult;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Driver Selection */}
      <RemoteSelect<Driver>
        label="Driver *"
        placeholder="Select Driver"
        value={selectedDriver}
        onChange={handleDriverChange}
        fetchData={(page, search) =>
          getDrivers({
            status: "active",
            search,
            page,
            limit: 20,
          })
        }
        hook={driversResult as any}
        getLabel={(item: Driver) => {
          // Format: "Name (License Number)"
          return item?.name
            ? `${item.name} (${item.license_number})`
            : "";
        }}
        getValue={(item: Driver) => item?.id || ""}
        error={errorDriver}
        required
        disabled={disabled}
        renderItem={(item: Driver) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-xs text-base-content/60">
              {item.license_number} • {item.phone || "No phone"}
            </span>
          </div>
        )}
      />

      {/* Vehicle Selection */}
      <RemoteSelect<Vehicle>
        label="Vehicle *"
        placeholder="Select Vehicle"
        value={selectedVehicle}
        onChange={handleVehicleChange}
        fetchData={(page, search) =>
          getVehicles({
            status: "active",
            search,
            page,
            limit: 20,
          })
        }
        hook={vehiclesResult as any}
        getLabel={(item: Vehicle) => {
          // Format: "Plate Number - Type"
          return item?.plate_number
            ? `${item.plate_number} - ${item.type || "Unknown"}`
            : "";
        }}
        getValue={(item: Vehicle) => item?.id || ""}
        error={errorVehicle}
        required
        disabled={disabled}
        renderItem={(item: Vehicle) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {item.plate_number} - {item.type || "Unknown"}
            </span>
            <span className="text-xs text-base-content/60">
              {item.make && item.model
                ? `${item.make} ${item.model}`
                : "No make/model"}
              {item.year && ` • ${item.year}`}
            </span>
          </div>
        )}
      />
    </div>
  );
});

DriverVehicleSelector.displayName = "DriverVehicleSelector";

export default DriverVehicleSelector;

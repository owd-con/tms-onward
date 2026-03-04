import { Alert } from "@/components";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";
import type { Driver, Vehicle, FailedShipment } from "@/services/types";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

interface RescheduleStep1Props {
  failedShipments: FailedShipment[];
  selectedDriver: Driver | null;
  selectedVehicle: Vehicle | null;
  onDriverVehicleChange: (selection: {
    driver?: Driver | null;
    vehicle?: Vehicle | null;
  }) => void;
}

/**
 * Reschedule Step 1 - Assign Resources
 *
 * Shows failed shipments info and allows driver & vehicle selection
 */
export const RescheduleStep1 = ({
  failedShipments,
  selectedDriver,
  selectedVehicle,
  onDriverVehicleChange,
}: RescheduleStep1Props) => {
  const FormState = useSelector((state: RootState) => state.form);

  return (
    <div className='space-y-4'>
      {/* Failed Shipments Info (Read-only) */}
      <div className='mb-4'>
        <h3 className='text-base lg:text-lg font-semibold mb-2'>
          Failed Shipments ({failedShipments.length})
        </h3>
        {failedShipments.length === 0 ? (
          <Alert variant='info'>
            No failed shipments found for this order.
          </Alert>
        ) : (
          <div className='space-y-2 max-h-[200px] overflow-y-auto p-3 bg-base-200 rounded-lg'>
            {failedShipments.map((shipment, idx) => (
              <div
                key={shipment.id || idx}
                className='p-2 bg-white rounded-lg border border-base-200'
              >
                <div className='flex items-center justify-between mb-1'>
                  <span className='font-semibold text-sm text-primary'>
                    {shipment.shipment_number}
                  </span>
                  <span className='text-xs text-base-content/60'>
                    #{shipment.sorting_id}
                  </span>
                </div>
                <div className='flex items-center gap-1 text-xs'>
                  <span className='text-base-content/70'>
                    ▲{" "}
                    {shipment.origin_location_name ||
                      shipment.origin_address ||
                      "Origin"}
                  </span>
                  <span className='text-base-content/40'>→</span>
                  <span className='text-base-content/70'>
                    ▼{" "}
                    {shipment.dest_location_name ||
                      shipment.dest_address ||
                      "Destination"}
                  </span>
                </div>
                {shipment.failed_reason && (
                  <div className='text-error text-xs mt-1'>
                    ⚠️ {shipment.failed_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver & Vehicle Selection */}
      <div>
        <h3 className='text-base lg:text-lg font-semibold mb-2'>
          Assign Driver & Vehicle
        </h3>
        <p className='text-sm text-base-content/60 mb-3'>
          Select an active driver and vehicle for the new trip
        </p>

        <DriverVehicleSelector
          value={{
            driver: selectedDriver,
            vehicle: selectedVehicle,
          }}
          onChange={onDriverVehicleChange}
        />
      </div>

      {!!FormState?.errors?.shipment_ids && (
        <div className='text-sm text-error'>
          {FormState.errors.shipment_ids as string}
        </div>
      )}
    </div>
  );
};

export default RescheduleStep1;

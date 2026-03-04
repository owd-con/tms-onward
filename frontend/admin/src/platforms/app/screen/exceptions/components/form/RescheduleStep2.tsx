import { Alert } from "@/components";
import type { Driver, Vehicle, FailedShipment } from "@/services/types";

interface RescheduleStep2Props {
  failedShipments: FailedShipment[];
  selectedDriver: Driver | null;
  selectedVehicle: Vehicle | null;
  hasError: boolean;
}

/**
 * Reschedule Step 2 - Confirm
 *
 * Shows summary of failed shipments, driver & vehicle assignment
 */
export const RescheduleStep2 = ({
  failedShipments,
  selectedDriver,
  selectedVehicle,
  hasError,
}: RescheduleStep2Props) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-base lg:text-lg font-semibold mb-1">
          Confirm Reschedule
        </h3>
        <p className="text-sm text-base-content/60">
          Please review the reschedule details below
        </p>
      </div>

      {/* Warning Alert */}
      <Alert variant="warning">
        <strong>Important:</strong> A new trip will be created with the
        selected driver and vehicle. All failed shipments will be reset to
        Pending status.
      </Alert>

      {/* Summary */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-base-content/70 mb-2">
            Failed Shipments ({failedShipments.length})
          </h4>
          <div className="space-y-2 p-3 bg-base-200 rounded-lg">
            {failedShipments.map((shipment, index) => (
              <div key={shipment.id || index} className="text-sm">
                <div className="font-medium text-primary">
                  {shipment.shipment_number} <span className="text-base-content/60">#{shipment.sorting_id}</span>
                </div>
                <div className="text-base-content/70 flex items-center gap-1">
                  <span>▲ {shipment.origin_location_name || shipment.origin_address || "Origin"}</span>
                  <span className="text-base-content/40">→</span>
                  <span>▼ {shipment.dest_location_name || shipment.dest_address || "Destination"}</span>
                </div>
                {shipment.failed_reason && (
                  <div className="text-error text-xs mt-1">
                    ⚠️ {shipment.failed_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        <div>
          <h4 className="text-sm font-semibold text-base-content/70 mb-2">
            New Assignment
          </h4>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Driver:</span>
              <span className="font-medium">
                {selectedDriver
                  ? `${selectedDriver.name} (${selectedDriver.license_number})`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Vehicle:</span>
              <span className="font-medium">
                {selectedVehicle
                  ? `${selectedVehicle.plate_number} - ${selectedVehicle.type}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <Alert variant="error">
          Failed to reschedule shipments. Please try again.
        </Alert>
      )}
    </div>
  );
};

export default RescheduleStep2;

import { Input } from "@/components";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";
import type { Driver, Vehicle } from "@/services/types";

interface TripStep2AssignResourcesProps {
  driver: Driver | null;
  vehicle: Vehicle | null;
  notes: string;
  onChange: (values: { driver: Driver | null; vehicle: Vehicle | null; notes: string }) => void;
  FormState: any;
}

export const TripStep2AssignResources = ({
  driver,
  vehicle,
  notes,
  onChange,
  FormState,
}: TripStep2AssignResourcesProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        Step 2: Assign Driver & Vehicle
      </h3>
      <p className="text-sm text-base-content/60 mb-4">
        Assign an available driver and vehicle to this trip.
      </p>

      <DriverVehicleSelector
        value={{
          driver,
          vehicle,
        }}
        onChange={(selection) => {
          onChange({
            driver: selection.driver,
            vehicle: selection.vehicle,
            notes,
          });
        }}
        error={FormState?.errors?.driver_id as string || FormState?.errors?.vehicle_id as string}
      />

      <Input
        label="Notes (Optional)"
        placeholder="Any notes for this trip"
        type="textarea"
        value={notes}
        onChange={(e) =>
          onChange({
            driver,
            vehicle,
            notes: e.target.value,
          })
        }
      />
    </div>
  );
};

export default TripStep2AssignResources;

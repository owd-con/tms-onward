import { useEffect } from "react";
import { Button } from "@/components";
import { statusBadge } from "@/shared/helper";
import { useTrip } from "@/services/driver/hooks";
import type { Trip } from "@/services/types";

interface TripInfoCardProps {
  tripId?: string;
  trip: Trip | null;
  onRefetch?: () => void;
}

/**
 * TripInfoCard - Component for displaying trip information
 *
 * Features:
 * - Displays status badge
 * - Displays vehicle info (plate number + model)
 * - Displays order number and customer name
 * - Manages Start Trip operation internally
 * - Auto-refetch after successful start trip
 *
 * Used in trip detail page.
 */
export const TripInfoCard = ({ tripId, trip, onRefetch }: TripInfoCardProps) => {
  // Hook for start trip mutation
  const { startTrip, startTripResult } = useTrip();

  // Auto-refetch after successful start trip
  useEffect(() => {
    if (startTripResult?.isSuccess) {
      onRefetch?.();
    }
  }, [startTripResult?.isSuccess]);

  // Handle start trip
  const handleStartTrip = () => {
    if (!tripId) return;
    startTrip({ id: tripId });
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <p className="typo-tiny text-content-secondary mb-1">Status</p>
          {statusBadge(trip?.status || "")}
        </div>

        {/* Vehicle */}
        <div>
          <p className="typo-tiny text-content-secondary mb-1">Vehicle</p>
          <p className="typo-small font-medium text-content-primary">
            {trip?.vehicle?.plate_number} {trip?.vehicle?.model || ""}
          </p>
        </div>

        {/* Order */}
        <div>
          <p className="typo-tiny text-content-secondary mb-1">Order</p>
          <p className="typo-small font-medium text-content-primary">
            {trip?.order?.order_number || "N/A"}
          </p>
        </div>

        {/* Customer */}
        <div>
          <p className="typo-tiny text-content-secondary mb-1">Customer</p>
          <p className="typo-small font-medium text-content-primary">
            {trip?.order?.customer?.name || "N/A"}
          </p>
        </div>
      </div>

      {/* Start Trip Button - Only show when status is "dispatched" */}
      {trip?.status === "dispatched" && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            variant="primary"
            size="xs"
            shape="block"
            onClick={handleStartTrip}
            disabled={startTripResult.isLoading}
          >
            {startTripResult.isLoading ? "Starting Trip..." : "Start Trip"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripInfoCard;

import type { Order, Driver, Vehicle } from "@/services/types";

interface TripStep4ConfirmProps {
  selectedOrder: Order | null;
  orderDetail: Order | null;
  driver: Driver | null;
  vehicle: Vehicle | null;
  notes: string;
  orderType: "FTL" | "LTL";
  waypointSequences: Array<{ order_waypoint_id: string; sequence_number: number }>;
}

export const TripStep4Confirm = ({
  selectedOrder,
  orderDetail,
  driver,
  vehicle,
  notes,
  orderType,
  waypointSequences,
}: TripStep4ConfirmProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        Step {orderType === "FTL" ? "3" : 4}: Confirm & Create Trip
      </h3>
      <p className="text-sm text-base-content/60 mb-6">
        Review the trip details below before creating.
      </p>

      <div className="space-y-4 bg-base-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-base-content/60">Order Number</span>
            <p className="font-semibold">{selectedOrder?.order_number || "-"}</p>
          </div>
          <div>
            <span className="text-xs text-base-content/60">Order Type</span>
            <p className="font-semibold">{orderDetail?.order_type || "-"}</p>
          </div>
          <div>
            <span className="text-xs text-base-content/60">Customer</span>
            <p className="font-semibold">
              {orderDetail?.customer?.name || "-"}
            </p>
          </div>
          <div>
            <span className="text-xs text-base-content/60">Waypoints</span>
            <p className="font-semibold">
              {orderDetail?.order_waypoints?.length || 0} waypoints
            </p>
          </div>
        </div>

        <div className="border-t border-base-content/10 pt-4">
          <span className="text-xs text-base-content/60">Assignment</span>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm">Driver</p>
              <p className="font-semibold">
                {driver?.name || "Selected"}
              </p>
            </div>
            <div>
              <p className="text-sm">Vehicle</p>
              <p className="font-semibold">
                {vehicle?.plate_number || "Selected"}
              </p>
            </div>
          </div>
        </div>

        {notes && (
          <div className="border-t border-base-content/10 pt-4">
            <span className="text-xs text-base-content/60">Notes</span>
            <p className="text-sm mt-1">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripStep4Confirm;

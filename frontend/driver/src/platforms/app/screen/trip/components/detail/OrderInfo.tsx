import type { Order, TripWaypoint } from "@/services/types";

interface OrderInfoProps {
  order?: Order | null;
  waypoint?: TripWaypoint | null;
}

/**
 * OrderInfo - Display order details for waypoint
 *
 * Displays:
 * - Order ID/number
 * - Shipment count
 */
export const OrderInfo = ({ order, waypoint }: OrderInfoProps) => {
  const shipmentCount = waypoint?.shipments?.length || 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-4">
      <h3 className="typo-card-title font-semibold text-content-primary mb-4">
        Order Details
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="typo-small text-content-secondary">Order ID:</span>
          <span className="typo-small font-medium text-content-primary">
            {order?.order_number || "N/A"}
          </span>
        </div>
        {shipmentCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="typo-small text-content-secondary">
              Shipments:
            </span>
            <span className="typo-small font-medium text-content-primary">
              {shipmentCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInfo;

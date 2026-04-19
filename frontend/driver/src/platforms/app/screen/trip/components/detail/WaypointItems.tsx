import type { DriverShipment } from "@/services/types";

interface WaypointItemsProps {
  shipments?: DriverShipment[] | null;
  isPickup: boolean;
}

/**
 * WaypointItems - Display shipments list for pickup/delivery waypoint
 *
 * Displays:
 * - Shipments to pick up (pickup waypoint)
 * - Shipments to deliver (delivery waypoint)
 * - Per shipment: shipment number, reference code, items, and weight
 */
export const WaypointItems = ({ shipments, isPickup }: WaypointItemsProps) => {
  if (!shipments || shipments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-4">
      <h3 className="typo-card-title font-semibold text-content-primary mb-4">
        {isPickup ? `Items to Pick Up (${shipments.length} shipments)` : `Items to Deliver (${shipments.length} shipments)`}
      </h3>
      <div className="space-y-3">
        {shipments.map((shipment, index) => (
          <div
            key={shipment.id || index}
            className="border border-slate-200 rounded-lg p-3 bg-slate-50"
          >
            {/* Shipment Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="typo-small font-semibold text-primary">
                  {shipment.shipment_number}
                </span>
                {shipment.reference_code && (
                  <span className="typo-tiny text-content-secondary">
                    Ref: {shipment.reference_code}
                  </span>
                )}
              </div>
              <span className="typo-tiny text-content-secondary">
                #{index + 1}
              </span>
            </div>

            {/* Route Info */}
            <div className="typo-tiny text-content-secondary mb-2">
              <div>▲ {shipment.origin_location_name || shipment.origin_address}</div>
              <div>▼ {shipment.dest_location_name || shipment.dest_address}</div>
            </div>

            {/* Items List */}
            {shipment.items && shipment.items.length > 0 && (
              <div className="space-y-1 border-t border-slate-200 pt-2">
                {shipment.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-content-primary">{item.name}</span>
                    <div className="text-right">
                      <span className="text-content-primary font-medium">
                        {item.quantity} pcs
                      </span>
                      {item.weight > 0 && (
                        <span className="text-content-secondary ml-1">
                          ({item.weight} kg)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Weight */}
      {shipments.some(s => s.total_weight > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between typo-small">
            <span className="text-content-secondary">Total Weight:</span>
            <span className="font-semibold text-content-primary">
              {shipments.reduce((sum, s) => sum + (s.total_weight || 0), 0).toFixed(1)} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaypointItems;

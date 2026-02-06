import type { OrderWaypoint } from "@/services/types";

interface WaypointItemsProps {
  orderWaypoint?: OrderWaypoint | null;
  isPickup: boolean;
}

/**
 * WaypointItems - Display items list for pickup/delivery waypoint
 *
 * Displays:
 * - Items to pick up (pickup waypoint)
 * - Items to deliver (delivery waypoint)
 * - Item name, quantity, and weight
 */
export const WaypointItems = ({ orderWaypoint, isPickup }: WaypointItemsProps) => {
  const items = orderWaypoint?.items;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-4">
      <h3 className="typo-card-title font-semibold text-content-primary mb-4">
        {isPickup ? "Items to Pick Up" : "Items to Deliver"}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <span className="typo-small text-content-primary">{item.name}</span>
            <div className="text-right">
              <span className="typo-small font-medium text-content-primary">
                {item.quantity} pcs
              </span>
              {(item.weight ?? 0) > 0 && (
                <span className="typo-tiny text-content-secondary ml-2">
                  ({item.weight} kg)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaypointItems;

import { HiMapPin } from "react-icons/hi2";
import { ScanWaypointCard } from "./ScanWaypointCard";
import type { WaypointPreview } from "@/services/types";

interface ScanWaypointListProps {
  waypoints: WaypointPreview[];
}

/**
 * ScanWaypointList - List component for displaying waypoints in scan order page
 *
 * Sorts waypoints by sequence_number and renders ScanWaypointCard for each
 */
export const ScanWaypointList = ({ waypoints }: ScanWaypointListProps) => {
  // Sort by sequence number
  const sortedWaypoints = [...waypoints].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );

  if (!sortedWaypoints || sortedWaypoints.length === 0) {
    return (
      <div className='bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center'>
        <HiMapPin size={40} className='mx-auto text-slate-300 mb-3' />
        <p className='text-slate-500'>No delivery points found</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='px-1 py-2 bg-slate-50 rounded-lg'>
        <h4 className='font-semibold text-content-primary flex items-center gap-2'>
          <HiMapPin size={18} />
          Delivery Points ({sortedWaypoints.length})
        </h4>
      </div>

      {/* Waypoint Cards */}
      {sortedWaypoints.map((waypoint, index) => (
        <ScanWaypointCard
          key={waypoint.id}
          waypoint={waypoint}
          index={index}
        />
      ))}
    </div>
  );
};

export default ScanWaypointList;
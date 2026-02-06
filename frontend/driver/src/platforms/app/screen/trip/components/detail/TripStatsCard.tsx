/**
 * TMS Driver - Trip Stats Card Component
 *
 * Menampilkan statistik waypoint dalam trip (Total, Done, Remaining).
 * Dipakai di Trip Detail page.
 */

import type { Trip } from "@/services/types";

interface TripStatsCardProps {
  trip: Trip | null;
}

export const TripStatsCard = ({ trip }: TripStatsCardProps) => {
  // Calculate waypoint stats
  const waypoints = trip?.trip_waypoints || [];
  const completedWaypoints = waypoints.filter(
    (wp) => wp.status === "completed",
  ).length;
  const totalWaypoints = waypoints.length;

  return (
    <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-5 shadow-sm'>
      <div className='grid grid-cols-3 gap-2 text-center'>
        {/* Total */}
        <div className='bg-white/10 rounded-lg p-2'>
          <p className='typo-tiny text-blue-100'>Total</p>
          <p className='typo-card-title font-bold text-white'>
            {totalWaypoints}
          </p>
        </div>

        {/* Done */}
        <div className='bg-white/10 rounded-lg p-2'>
          <p className='typo-tiny text-blue-100'>Done</p>
          <p className='typo-card-title font-bold text-white'>
            {completedWaypoints}
          </p>
        </div>

        {/* Remaining */}
        <div className='bg-white/10 rounded-lg p-2'>
          <p className='typo-tiny text-blue-100'>Remaining</p>
          <p className='typo-card-title font-bold text-white'>
            {totalWaypoints - completedWaypoints}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripStatsCard;

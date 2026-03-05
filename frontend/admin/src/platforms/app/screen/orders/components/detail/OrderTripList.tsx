/**
 * TMS Onward - Order Trip List Component
 *
 * Simple list of trips for an order.
 * Compact design for side panel display.
 */

import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dateFormat, statusIcon } from "@/shared/helper";
import type { Trip } from "@/services/types";
import { useLazyGetTripsQuery } from "@/services/trip/api";

interface OrderTripListProps {
  orderId: string;
  className?: string;
}

export const OrderTripList = memo<OrderTripListProps>(
  ({ orderId, className }) => {
    const navigate = useNavigate();
    const [getTrips, { data: tripsData, isLoading }] = useLazyGetTripsQuery();
    const [trips, setTrips] = useState<Trip[]>([]);

    // Handle trip card click
    const handleTripClick = (tripId: string) => {
      navigate(`/a/trips/${tripId}`);
    };

    // Fetch trips by order_id
    useEffect(() => {
      if (orderId) {
        getTrips({ order_id: orderId });
      }
    }, [orderId, getTrips]);

    // Sync trips state when data changes
    useEffect(() => {
      if (tripsData?.data) {
        setTrips(tripsData.data);
      }
    }, [tripsData]);

    if (isLoading) {
      return (
        <div className='bg-white rounded-xl p-4 lg:p-6 shadow-sm'>
          <div className='flex justify-center items-center h-24'>
            <div className='loading loading-spinner'></div>
          </div>
        </div>
      );
    }

    if (trips.length === 0) {
      return null;
    }

    // Sort by created_at to show chronological order (newest first)
    const sortedTrips = [...trips].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return (
      // <div className='p-4 lg:p-6 shadow-sm'>
      <div className='space-y-2'>
        {sortedTrips.map((trip, index) => (
          <div
            key={trip.id}
            onClick={() => handleTripClick(trip.id)}
            className='p-3 bg-white rounded-lg border border-base-200 hover:border-primary cursor-pointer transition-colors'
          >
            {/* Trip Number & Status */}
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-semibold text-base-content'>
                {trip.trip_number}
              </span>
              {statusIcon(trip.status)}
            </div>

            {/* Driver & Vehicle */}
            <div className='flex items-center gap-3 text-xs text-base-content/70'>
              {trip.driver?.name && <span>👤 {trip.driver.name}</span>}
              {trip.vehicle?.plate_number && (
                <span>🚗 {trip.vehicle.plate_number}</span>
              )}
            </div>

            {/* Dates */}
            {(trip.started_at || trip.completed_at) && (
              <div className='mt-2 pt-2 border-t border-base-200 text-xs text-base-content/60'>
                {trip.started_at && (
                  <span>
                    Started: {dateFormat(trip.started_at, "DD/MM/YYYY")}
                  </span>
                )}
                {trip.started_at && trip.completed_at && (
                  <span className='mx-1'>•</span>
                )}
                {trip.completed_at && (
                  <span>
                    Completed: {dateFormat(trip.completed_at, "DD/MM/YYYY")}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      // </div>
    );
  },
);

OrderTripList.displayName = "OrderTripList";

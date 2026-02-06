/**
 * TMS Onward - Order Trip List Component
 *
 * Displays list of trips for an order (including historical trips for rescheduled orders)
 * Shows trip progression: Trip 1, Trip 2, etc.
 */

import { memo, useEffect, useState } from "react";
import clsx from "clsx";
import { dateFormat, statusBadge } from "@/shared/helper";
import type { Trip } from "@/services/types";
import { useLazyGetTripsQuery } from "@/services/trip/api";

interface OrderTripListProps {
  orderId: string;
  className?: string;
}

export const OrderTripList = memo<OrderTripListProps>(
  ({ orderId, className }) => {
    const [getTrips, { data: tripsData, isLoading }] = useLazyGetTripsQuery();
    const [trips, setTrips] = useState<Trip[]>([]);

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
        <div
          className={clsx(
            "bg-white rounded-xl p-4 lg:p-6 shadow-sm",
            className,
          )}
        >
          <h3 className='text-base lg:text-lg font-semibold mb-4'>
            Trip History
          </h3>
          <div className='flex justify-center items-center h-32'>
            <div className='loading loading-spinner loading-lg'></div>
          </div>
        </div>
      );
    }

    if (trips.length === 0) {
      return null;
    }

    // Sort by created_at to show chronological order
    const sortedTrips = [...trips].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return (
      <div
        className={clsx("bg-white rounded-xl p-4 lg:p-6 shadow-sm", className)}
      >
        <h3 className='text-base lg:text-lg font-semibold mb-4'>
          Trip History
        </h3>
        <div className='space-y-3'>
          {sortedTrips.map((trip, index) => (
            <div
              key={trip.id}
              className='border border-base-200 rounded-lg p-4 hover:bg-base-50 transition-colors'
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                    <span className='text-sm font-bold text-primary'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className='font-semibold text-base-content'>
                      {trip.trip_number}
                    </h4>
                    <p className='text-xs text-base-content/60'>
                      {dateFormat(trip.created_at, "DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                </div>
                {statusBadge(trip.status)}
              </div>

              {/* Details */}
              <div className='grid grid-cols-2 gap-3 text-sm'>
                {trip.driver?.name && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Driver
                    </span>
                    <span className='font-medium'>{trip.driver.name}</span>
                  </div>
                )}
                {trip.vehicle?.plate_number && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Vehicle
                    </span>
                    <span className='font-medium'>
                      {trip.vehicle.plate_number}
                    </span>
                  </div>
                )}
                {trip.started_at && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Started
                    </span>
                    <span className='text-sm'>
                      {dateFormat(trip.started_at, "DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                )}
                {trip.completed_at && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Completed
                    </span>
                    <span className='text-sm'>
                      {dateFormat(trip.completed_at, "DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

OrderTripList.displayName = "OrderTripList";

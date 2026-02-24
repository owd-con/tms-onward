// 1. React & core libraries
import { memo, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

// 2. Third-party libraries
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// 3. Internal imports (gunakan alias @)
import { useTracking } from "@/services/tracking/hooks";
import { statusBadge } from "@/shared/helper";
import { dateFormat } from "@/utils/common";
import { WaypointTimeline, PODGallery } from "@/components/tracking";

// 4. Type definitions
interface TrackingResultProps {
  orderNumber?: string;
}

// 5. Component definition dengan memo untuk performance
const TrackingResult = memo(
  ({ orderNumber: propOrderNumber }: TrackingResultProps) => {
    const { orderNumber: paramOrderNumber } = useParams();
    const finalOrderNumber = propOrderNumber || paramOrderNumber || "";

    const [data, setData] = useState<any>(null);

    const { getTrackingByOrderNumber, getTrackingByOrderNumberResult } =
      useTracking();

    const fetch = () => {
      getTrackingByOrderNumber(finalOrderNumber);
    };

    // Trigger fetch on mount
    useEffect(() => {
      fetch();
    }, []);

    useEffect(() => {
      if (getTrackingByOrderNumberResult?.isSuccess) {
        setData(getTrackingByOrderNumberResult.data?.data);
      }
    }, [getTrackingByOrderNumberResult?.isSuccess]);

    // Loading state
    if (getTrackingByOrderNumberResult?.isLoading) {
      return (
        <div className='space-y-6'>
          {/* Order info skeleton */}
          <div className='bg-white rounded-xl border border-gray-200 p-6 animate-pulse'>
            <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>

          {/* Timeline skeleton */}
          <div className='bg-white rounded-xl border border-gray-200 p-6 animate-pulse'>
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center space-x-3'>
                  <div className='h-8 w-8 bg-gray-200 rounded-full'></div>
                  <div className='flex-1'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-1'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Error state
    if (getTrackingByOrderNumberResult?.isError || !data) {
      const isNotFound = (getTrackingByOrderNumberResult?.error as any)?.status === 500;

      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='bg-red-50 p-4 rounded-full mb-4'>
            <ExclamationTriangleIcon className='h-12 w-12 text-red-500' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {isNotFound ? "Order Not Found" : "Unable to Load Tracking"}
          </h2>
          <p className='text-gray-600 text-center mb-6 max-w-md'>
            {isNotFound
              ? `No order found with number "${finalOrderNumber}". Please check and try again.`
              : "An error occurred while loading tracking information. Please try again."}
          </p>
          <div className='flex space-x-3'>
            <button
              onClick={() => fetch()}
              className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90'
            >
              Try Again
            </button>
            <Link
              to='/'
              className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
            >
              Track Another
            </Link>
          </div>
        </div>
      );
    }

    const {
      order_number,
      status,
      customer_name,
      created_at,
      waypoint_history,
      waypoint_images,
      driver,
      vehicle,
    } = data;

    return (
      <div className='space-y-6'>
        {/* Header with Track Another button */}
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900'>Tracking Result</h1>
          <Link
            to='/'
            className='inline-flex items-center space-x-2 text-primary hover:text-primary/80'
          >
            <ArrowLeftIcon className='h-4 w-4' />
            <span>Track Another</span>
          </Link>
        </div>

        {/* Order Info Card */}
        <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
          <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <div className='flex items-center space-x-3 mb-2'>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    {order_number}
                  </h2>
                  {statusBadge(status)}
                </div>
                <p className='text-gray-600'>
                  Customer: {customer_name || "-"}
                </p>
              </div>
              <div className='text-sm text-gray-500'>
                <p>Created: {dateFormat(created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle Info (if available) */}
        {(driver || vehicle) && (
          <div className='bg-white rounded-xl border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Driver & Vehicle
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {driver && (
                <div>
                  <p className='text-sm text-gray-500'>Driver</p>
                  <p className='font-medium'>{driver.name}</p>
                </div>
              )}
              {vehicle && (
                <div>
                  <p className='text-sm text-gray-500'>Vehicle</p>
                  <p className='font-medium'>{vehicle.plate_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Waypoint Timeline */}
        <WaypointTimeline
          waypointLogs={waypoint_history}
          waypointImages={waypoint_images}
        />

        {/* POD Gallery (if available) */}
        <PODGallery images={waypoint_images} />
      </div>
    );
  },
);

// Named export (no displayName needed in modern React)
export { TrackingResult };

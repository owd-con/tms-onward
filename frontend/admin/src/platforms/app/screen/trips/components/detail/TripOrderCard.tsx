import { Button } from "@/components";
import type { Trip } from "@/services/types";
import { useNavigate } from "react-router-dom";

interface TripOrderCardProps {
  trip: Trip;
}

/**
 * TripOrderCard - Display order information related to this trip
 *
 * Displays:
 * - Order number, customer name
 * - Order type, order status
 * - View Order Details button
 */
export const TripOrderCard = ({ trip }: TripOrderCardProps) => {
  const navigate = useNavigate();

  if (!trip.order) {
    return null;
  }

  return (
    <div className='bg-base-100 rounded-xl p-4 lg:p-6 shadow-sm '>
      <h3 className='text-base lg:text-lg font-semibold mb-4'>
        Order Information
      </h3>

      <div className='grid grid-cols-3 gap-2'>
        <div>
          <span className='text-xs text-base-content/60 block'>
            Order Number
          </span>
          <span className='font-semibold text-sm'>
            {trip.order.order_number}
          </span>
        </div>
        <div>
          <span className='text-xs text-base-content/60 block'>Customer</span>
          <span className='text-sm'>{trip.order.customer?.name || "-"}</span>
        </div>
        <div>
          <span className='text-xs text-base-content/60 block'>Order Type</span>
          <span className='text-sm capitalize'>{trip.order.order_type}</span>
        </div>
      </div>

      <div className='mt-4'>
        <Button
          size='sm'
          variant='secondary'
          className='w-full'
          onClick={() => navigate(`/a/orders/${trip.order?.id}`)}
        >
          View Order Details
        </Button>
      </div>
    </div>
  );
};

export default TripOrderCard;

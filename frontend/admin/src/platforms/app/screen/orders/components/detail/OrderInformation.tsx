import { statusBadge, dateFormat } from "@/shared/helper";
import { formatCurrency } from "@/shared/utils/formatter";
import type { Order } from "@/services/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components";

interface OrderInformationProps {
  order: Order;
}

/**
 * OrderInformation - Display order and customer information details
 *
 * Displays:
 * - Order number, type, status, total price
 * - Reference code, special instructions
 * - Created at/updated at
 * - Customer information (name, email, phone, address)
 * - View Customer Details button
 */
export const OrderInformation = ({ order }: OrderInformationProps) => {
  const navigate = useNavigate();

  return (
    <div className='bg-white rounded-xl p-4 lg:p-6 shadow-sm h-full'>
      <h3 className='text-base lg:text-lg font-semibold mb-4'>
        Order Information
      </h3>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4'>
        <div>
          <span className='text-xs text-base-content/60 block'>
            Order Number
          </span>
          <span className='font-semibold text-sm'>{order.order_number}</span>
        </div>
        <div>
          <span className='text-xs text-base-content/60 block'>Order Type</span>
          <span className='font-semibold text-sm'>{order.order_type}</span>
        </div>
        <div>
          <span className='text-xs text-base-content/60 block'>Status</span>
          {statusBadge(order.status)}
        </div>
        <div>
          <span className='text-xs text-base-content/60 block'>
            Total Price
          </span>
          <span className='font-semibold text-sm text-success'>
            {order.total_price ? formatCurrency(order.total_price) : "-"}
          </span>
        </div>
      </div>

      <div className='mt-4 pt-4 border-t border-base-300/50 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4'>
        {order.reference_code && (
          <div>
            <span className='text-xs text-base-content/60 block'>
              Reference Code
            </span>
            <span className='font-semibold text-sm'>
              {order.reference_code}
            </span>
          </div>
        )}

        {order.special_instructions && (
          <div className='col-span-1 lg:col-span-3'>
            <span className='text-xs text-base-content/60 block'>
              Special Instructions
            </span>
            <p className='text-sm text-base-content/80'>
              {order.special_instructions}
            </p>
          </div>
        )}

        {/* Delivery Progress - Only for LTL orders */}
        {order.order_type === "LTL" && (
          <div className="col-span-2 lg:col-span-2">
            <span className='text-xs text-base-content/60 block mb-1'>
              Delivery Progress
            </span>
            <div className="flex flex-col gap-1">
              <progress
                className="progress progress-success w-full h-2"
                value={
                  order.total_shipment && order.total_shipment > 0
                    ? Math.round(((order.total_delivered || 0) / order.total_shipment) * 100)
                    : 0
                }
                max="100"
              />
              <div className="flex justify-between text-xs">
                <span className="text-base-content/70">
                  {order.total_delivered || 0}/{order.total_shipment || 0}
                </span>
                <span className="font-semibold text-success">
                  {order.total_shipment && order.total_shipment > 0
                    ? Math.round(((order.total_delivered || 0) / order.total_shipment) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {order.created_at && order.created_at !== "0001-01-01T00:00:00Z" && (
          <div>
            <span className='text-xs text-base-content/60 block'>
              Created At
            </span>
            <span className='text-sm'>{dateFormat(order.created_at)}</span>
            {order.created_by && (
              <span className='text-xs text-base-content/60 block mt-1'>
                by {order.created_by}
              </span>
            )}
          </div>
        )}
        {order.updated_at && order.updated_at !== "0001-01-01T00:00:00Z" && (
          <div>
            <span className='text-xs text-base-content/60 block'>
              Updated At
            </span>
            <span className='text-sm'>{dateFormat(order.updated_at)}</span>
            {order.updated_by && (
              <span className='text-xs text-base-content/60 block mt-1'>
                by {order.updated_by}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className='mt-4 pt-4 border-t border-base-300/50'>
        <h4 className='text-sm font-semibold text-base-content mb-3'>
          Customer Information
        </h4>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-base-content/60'>Name</span>
            <span className='font-medium text-sm'>
              {order.customer?.name || "-"}
            </span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-base-content/60'>Email</span>
            <span className='text-sm'>{order.customer?.email || "-"}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-base-content/60'>Phone</span>
            <span className='text-sm'>{order.customer?.phone || "-"}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-base-content/60'>Address</span>
            <span className='text-sm'>{order.customer?.address || "-"}</span>
          </div>
        </div>

        {order.customer && (
          <div className='mt-4'>
            <Button
              size='sm'
              variant='secondary'
              className='w-full'
              onClick={() =>
                navigate(`/a/master-data/customers/${order.customer?.id}`)
              }
            >
              View Customer Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInformation;

import { useEnigmaUI } from "@/components";
import type { Shipment } from "@/services/types";
import { dateFormat, statusBadge, statusColors, statusIcon } from "@/shared/helper";
import { formatCurrency } from "@/shared/utils/formatter";
import { Button } from "@/components";
import {
  HiArrowUturnLeft,
  HiOutlineCube,
  HiMapPin,
} from "react-icons/hi2";
import ReturnShipmentModal from "../modal/return.shipment";

interface ShipmentTimelineProps {
  shipments: Shipment[];
  orderType?: "FTL" | "LTL";
  /**
   * Callback when return is successful (for refetching parent data)
   */
  onReturnSuccess?: () => void;
}

/**
 * TMS Onward - Shipment Timeline Component
 *
 * Modern card-based display with 3-column layout inside each card
 */
const ShipmentTimeline = ({
  shipments,
  orderType,
  onReturnSuccess,
}: ShipmentTimelineProps) => {
  const { openModal, closeModal } = useEnigmaUI();

  const openReturnShipmentModal = (shipment: Shipment) => {
    openModal({
      id: "return-shipment",
      content: (
        <ReturnShipmentModal
          open={true}
          shipment={shipment}
          onClose={() => closeModal("return-shipment")}
          onSuccess={() => {
            closeModal("return-shipment");
            onReturnSuccess?.();
          }}
        />
      ),
    });
  };

  if (!shipments || shipments.length === 0) {
    return (
      <div className='text-center py-12'>
        <HiOutlineCube className='w-12 h-12 mx-auto text-base-content/30 mb-3' />
        <p className='text-base-content/60'>No shipments available</p>
      </div>
    );
  }

  // Sort by sorting_id (sequence within order)
  const sortedShipments = [...shipments].sort(
    (a, b) => a.sorting_id - b.sorting_id,
  );

  return (
    <div className='space-y-4'>
      {sortedShipments.map((shipment, index) => {
        const { bgColor, color } = statusColors(shipment.status);

        return (
          <div
            key={shipment.id}
            className='relative bg-white border border-base-300 rounded-xl overflow-hidden hover:shadow-md transition-shadow'
          >
            {/* Status Header */}
            <div
              className={`${bgColor} ${color} px-4 py-3 flex items-center justify-between`}
            >
              <div className='flex items-center gap-2'>
                {statusIcon(shipment.status)}
                <span className='font-semibold text-sm'>
                  Shipment #{index + 1}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                {statusBadge(shipment.status)}
                {orderType === "LTL" && (
                  <span className='text-xs opacity-80'>
                    {shipment.shipment_number}
                  </span>
                )}
              </div>
            </div>

            {/* Content - Layout: Route on top, Schedule & Details below */}
            <div className='p-4 space-y-4'>
              {/* Row 1: Route (full width) */}
              <div>
                <div className='text-xs font-medium text-base-content/60 uppercase tracking-wide mb-3'>
                  Route
                </div>

                {/* Origin → Destination side by side */}
                <div className='grid grid-cols-2 gap-3'>
                  {/* Origin */}
                  <div className='flex gap-2'>
                    <div className='flex-shrink-0'>
                      <div className='w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center'>
                        <HiMapPin className='w-3 h-3' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      {shipment.origin_location_name && (
                        <div className='font-medium text-sm text-base-content truncate'>
                          {shipment.origin_location_name}
                        </div>
                      )}
                      <div className='text-xs text-base-content/70 line-clamp-2'>
                        {shipment.origin_address}
                      </div>
                      {shipment.origin_contact_name && (
                        <div className='text-xs text-base-content/60 mt-1'>
                          {shipment.origin_contact_name}
                          {shipment.origin_contact_phone &&
                            ` • ${shipment.origin_contact_phone}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className='flex gap-2'>
                    <div className='flex-shrink-0'>
                      <div className='w-6 h-6 rounded-full bg-info/10 text-info flex items-center justify-center'>
                        <HiMapPin className='w-3 h-3' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      {shipment.dest_location_name && (
                        <div className='font-medium text-sm text-base-content truncate'>
                          {shipment.dest_location_name}
                        </div>
                      )}
                      <div className='text-xs text-base-content/70 line-clamp-2'>
                        {shipment.dest_address}
                      </div>
                      {shipment.dest_contact_name && (
                        <div className='text-xs text-base-content/60 mt-1'>
                          {shipment.dest_contact_name}
                          {shipment.dest_contact_phone &&
                            ` • ${shipment.dest_contact_phone}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow between */}
                <div className='flex items-center justify-center my-2'>
                  <div className='flex items-center gap-1 text-base-content/30'>
                    <div className='w-12 h-px bg-current' />
                    <span className='text-xs'>→</span>
                    <div className='w-12 h-px bg-current' />
                  </div>
                </div>
              </div>

              {/* Row 2: Schedule & Details side by side */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Schedule */}
                <div className='space-y-3'>
                  <div className='text-xs font-medium text-base-content/60 uppercase tracking-wide'>
                    Schedule
                  </div>

                  {/* Pickup */}
                  <div className='bg-base-50 rounded-lg p-3 border border-base-200'>
                    <div className='text-xs text-base-content/60 mb-1'>
                      Pickup
                    </div>
                    <div className='font-semibold text-base-content'>
                      {dateFormat(
                        shipment.scheduled_pickup_date,
                        "DD MMM YYYY",
                      )}
                    </div>
                    {shipment.scheduled_pickup_time && (
                      <div className='text-sm text-base-content/70'>
                        {shipment.scheduled_pickup_time}
                      </div>
                    )}
                    {shipment.actual_pickup_time && (
                      <div className='mt-2 pt-2 border-t border-base-200'>
                        <div className='text-xs text-success'>
                          ✓{" "}
                          {dateFormat(
                            shipment.actual_pickup_time,
                            "DD MMM, HH:mm",
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery */}
                  <div className='bg-base-50 rounded-lg p-3 border border-base-200'>
                    <div className='text-xs text-base-content/60 mb-1'>
                      Delivery
                    </div>
                    <div className='font-semibold text-base-content'>
                      {dateFormat(
                        shipment.scheduled_delivery_date,
                        "DD MMM YYYY",
                      )}
                    </div>
                    {shipment.scheduled_delivery_time && (
                      <div className='text-sm text-base-content/70'>
                        {shipment.scheduled_delivery_time}
                      </div>
                    )}
                    {shipment.actual_delivery_time && (
                      <div className='mt-2 pt-2 border-t border-base-200'>
                        <div className='text-xs text-success'>
                          ✓{" "}
                          {dateFormat(
                            shipment.actual_delivery_time,
                            "DD MMM, HH:mm",
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className='space-y-3'>
                  <div className='text-xs font-medium text-base-content/60 uppercase tracking-wide'>
                    Details
                  </div>

                  {/* Price */}
                  {shipment.price && shipment.price > 0 ? (
                    <div className='bg-success/5 rounded-lg p-3 border border-success/20'>
                      <div className='text-xs text-base-content/60 mb-1'>
                        Price
                      </div>
                      <div className='font-semibold text-success text-lg'>
                        {formatCurrency(shipment.price)}
                      </div>
                    </div>
                  ) : (
                    <div className='bg-base-50 rounded-lg p-3 border border-base-200'>
                      <div className='text-xs text-base-content/60'>
                        FTL - Included in order price
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  {shipment.items &&
                    Array.isArray(shipment.items) &&
                    shipment.items.length > 0 && (
                      <div className='bg-base-50 rounded-lg p-3 border border-base-200'>
                        <div className='flex items-center gap-2 text-xs text-base-content/70 mb-2'>
                          <HiOutlineCube className='w-3.5 h-3.5' />
                          <span className='font-medium'>
                            Items ({shipment.items.length})
                          </span>
                        </div>
                        <div className='space-y-1'>
                          {shipment.items.slice(0, 3).map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className='text-xs flex gap-2 text-base-content/80'
                            >
                              <span className='flex-1 truncate'>
                                {item.name}
                              </span>
                              <span className='text-base-content/50'>
                                x{item.quantity}
                              </span>
                              {item.weight && item.weight > 0 && (
                                <span className='text-base-content/50'>
                                  {item.weight}kg
                                </span>
                              )}
                            </div>
                          ))}
                          {shipment.items.length > 3 && (
                            <div className='text-xs text-base-content/50'>
                              +{shipment.items.length - 3} more...
                            </div>
                          )}
                          {shipment.total_weight &&
                            shipment.total_weight > 0 && (
                              <div className='text-xs text-base-content/60 mt-2 pt-2 border-t border-base-200'>
                                Total: {shipment.total_weight} kg
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                  {/* Status Notes */}
                  {(shipment.received_by ||
                    shipment.failed_reason ||
                    shipment.delivery_notes) && (
                    <div className='bg-base-50 rounded-lg p-3 border border-base-200'>
                      {shipment.received_by && (
                        <div className='text-xs mb-2'>
                          <span className='text-success font-medium'>
                            Received:
                          </span>{" "}
                          <span className='text-base-content'>
                            {shipment.received_by}
                          </span>
                        </div>
                      )}
                      {shipment.failed_reason && (
                        <div className='text-xs mb-2'>
                          <span className='text-error font-medium'>
                            Failed:
                          </span>{" "}
                          <span className='text-base-content'>
                            {shipment.failed_reason}
                          </span>
                        </div>
                      )}
                      {shipment.delivery_notes && (
                        <div className='text-xs'>
                          <span className='text-base-content/60 font-medium'>
                            Notes:
                          </span>{" "}
                          <span className='text-base-content'>
                            {shipment.delivery_notes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              {shipment.status === "failed" && (
                <div className='mt-4 pt-4 border-t border-base-200'>
                  <Button
                    variant='warning'
                    size='sm'
                    onClick={() => openReturnShipmentModal(shipment)}
                    className='w-full gap-2'
                  >
                    <HiArrowUturnLeft className='w-4 h-4' />
                    Return to Origin
                  </Button>
                </div>
              )}

              {/* Returned Note */}
              {shipment.status === "returned" && shipment.returned_note && (
                <div className='mt-4 pt-4 border-t border-base-200'>
                  <div className='bg-warning/10 rounded-lg p-3 border border-warning/30'>
                    <div className='flex items-start gap-2'>
                      <HiArrowUturnLeft className='w-4 h-4 text-warning flex-shrink-0 mt-0.5' />
                      <div className='text-xs'>
                        <span className='font-medium text-warning'>
                          Returned:
                        </span>{" "}
                        <span className='text-base-content'>
                          {shipment.returned_note}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShipmentTimeline;

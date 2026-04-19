import React from "react";
import { CheckCircle2, RefreshCcw, Trash2 } from "lucide-react";
import type { Trip } from "@/services/types";
import dayjs from "dayjs";

interface TripLoadCardProps {
  trip: Trip;
  status: string;
  isSelected: boolean;
  onClick: () => void;
  onReassign?: (tripId: string) => void;
  onDelete?: (tripId: string) => void;
}

export const TripLoadCard: React.FC<TripLoadCardProps> = ({
  trip,
  status,
  isSelected,
  onClick,
  onReassign,
  onDelete,
}) => {
  // Use order data if available, fallback to trip data
  const orderNumber = trip.order?.order_number || trip.trip_number || "Unknown";
  const orderType = trip.order?.order_type || "N/A";
  const customerName = trip.order?.customer?.name || "Unknown Customer";

  // Driver and Vehicle
  const driverName = trip.driver?.name || trip.user?.name || "Unassigned";
  const vehiclePlate = trip.vehicle?.plate_number || "No Vehicle";

  const totalShipment = trip.order?.total_shipment || 0;
  const totalDelivered = trip.order?.total_delivered || 0;

  const isFTL = orderType === "FTL";
  const badgeColors = isFTL
    ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/50"
    : "bg-violet-100/80 text-violet-700 border-violet-200/50";

  const isCompleted = trip.status === "completed" || status === "history";

  let statusBadgeClass =
    "bg-blue-50 text-blue-700 border-blue-200/50 ring-1 ring-blue-200";

  if (trip.status === "planned") {
    statusBadgeClass =
      "bg-amber-50 text-amber-700 border-amber-200/50 ring-1 ring-amber-200";
  } else if (trip.status === "dispatched") {
    statusBadgeClass =
      "bg-violet-50 text-violet-700 border-violet-200/50 ring-1 ring-violet-200";
  } else if (trip.status === "in_transit") {
    statusBadgeClass =
      "bg-blue-50 text-blue-700 border-blue-200/50 ring-1 ring-blue-200";
  } else if (isCompleted) {
    statusBadgeClass =
      "bg-emerald-50 text-emerald-700 border-emerald-200/50 ring-1 ring-emerald-200";
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[20px] p-5 cursor-pointer transition-all border block ${
        isSelected
          ? "border-primary shadow-lg shadow-primary/20 ring-1 ring-primary"
          : "border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-5'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] tracking-widest border ${badgeColors}`}
          >
            {orderType}
          </div>
          <div>
            <span className='font-bold text-slate-900 text-[16px] tracking-tight block'>
              {orderNumber}
            </span>
            <span className='text-[11px] text-slate-500 font-medium'>
              {trip.trip_number}
            </span>
            {trip?.order?.reference_code && (
              <p className='text-[11px] text-slate-500 font-medium'>
                {`Ref: ${trip?.order.reference_code}`}
              </p>
            )}
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${statusBadgeClass}`}
        >
          {trip.status?.replace(/_/g, " ")}
        </div>
      </div>

      {/* Load Details Metrics (Customized for Trip) */}
      <div className='flex bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-5 text-center'>
        <div className='flex-1 border-r border-slate-200/60 px-1'>
          <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5'>
            Driver
          </p>
          <p className='text-xs font-black text-slate-800 truncate'>
            {driverName.split(" ")[0]}
          </p>
        </div>
        <div className='flex-1 border-r border-slate-200/60 px-1'>
          <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5'>
            Vehicle
          </p>
          <p className='text-xs font-black text-slate-800 truncate'>
            {vehiclePlate}
          </p>
        </div>
        <div className='flex-1 border-r border-slate-200/60 px-1'>
          <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5'>
            Stops
          </p>
          <p className='text-xs font-black text-slate-800'>
            {trip.total_completed || 0}/{trip.total_waypoints || 0}
          </p>
        </div>
        <div className='flex-1 px-1'>
          <p className='text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5'>
            Dev'd
          </p>
          <p className='text-xs font-black text-slate-800'>
            {totalDelivered}/{totalShipment}
          </p>
        </div>
      </div>

      {/* Separator line */}
      <div className='h-px w-full bg-slate-100 mb-4'></div>

      {/* Customer / Action */}
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] tracking-widest shadow-sm'>
            {customerName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className='text-[13px] font-bold text-slate-900 leading-none mb-1 truncate max-w-[150px]'>
              {customerName}
            </p>
            <p className='text-[10px] font-bold tracking-wider uppercase text-slate-500 leading-none'>
              Customer
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {!isCompleted && (
            <>
              {onReassign && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReassign(trip.id);
                  }}
                  className='p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors'
                  title='Reassign Driver'
                >
                  <RefreshCcw className='size-4' />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(trip.id);
                  }}
                  className='p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                  title='Delete Trip'
                >
                  <Trash2 className='size-4' />
                </button>
              )}
            </>
          )}
          {isCompleted && trip.completed_at && (
            <div className='flex items-center gap-1.5 text-emerald-600'>
              <CheckCircle2 className='size-4' strokeWidth={2.5} />
              <span className='text-[11px] font-bold tracking-wide'>
                {dayjs(trip.completed_at).format("DD MMM, HH:mm")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

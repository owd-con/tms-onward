import React from 'react';
import { X, Package, MapPin, RotateCcw, Truck } from 'lucide-react';
import type { Order } from '@/services/types';
import { orderApi } from "@/services/order/api";
import dayjs from 'dayjs';

interface OrderDetailFloatingCardProps {
  order: Order;
  onClose: () => void;
}

export const OrderDetailFloatingCard: React.FC<OrderDetailFloatingCardProps> = ({ order, onClose }) => {
  const isException = !!order.failed_shipments && order.failed_shipments.length > 0;

  const { data: previewData, isLoading: isLoadingPreview } = orderApi.endpoints.getWaypointPreview.useQuery(
    { id: order.id },
    { skip: isException }
  );

  const isFTL = order.order_type === 'FTL';
  const badgeColors = isFTL
    ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50'
    : 'bg-violet-100/80 text-violet-700 border-violet-200/50';

  const orderNumber = order.order_number || 'Unknown';
  const createdAt = order.created_at;
  const createdBy = order.created_by;

  const displayWaypoints = isException
    ? order.failed_shipments!.flatMap((fs: any, idx: number) => [
        {
          type: 'pickup',
          location_name: fs.origin_location_name || fs.origin_location || 'Origin City',
          address: fs.origin_address || 'Address not available',
          sequence_number: idx * 2 + 1,
        },
        {
          type: 'delivery',
          location_name: fs.dest_location_name || fs.dest_location || 'Destination City',
          address: fs.dest_address || fs.dest_location || 'Address not available',
          sequence_number: idx * 2 + 2,
          failed_reason: fs.failed_reason
        }
      ])
    : (previewData?.data || []);

  const isLoading = !isException && isLoadingPreview;

  return (
    <div className="absolute top-6 left-6 w-[400px] bg-white/95 backdrop-blur-md rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden z-20 flex flex-col max-h-[calc(100vh-48px)]">
      {/* Header Actions */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-center bg-white/50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] tracking-widest border shrink-0 ${isException ? 'bg-red-100/80 text-red-700 border-red-200/50' : badgeColors}`}>
            {isException ? 'FAILED' : order.order_type}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[15px] font-medium text-slate-900 tracking-tight leading-none mb-1 truncate">{orderNumber}</h2>
            {(createdAt || createdBy) && (
              <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                {createdAt ? dayjs(createdAt).format('DD MMM YYYY • HH:mm') : ''}
                {createdAt && createdBy ? ' - ' : ''}
                {createdBy ? createdBy : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} strokeWidth={2.5} /></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-8 space-y-4">
        
        {/* Basic Info Split Card */}
        <div className="p-4 bg-transparent rounded-2xl border border-slate-200 flex gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Customer</p>
            <p className="text-[13px] font-bold text-slate-900 truncate">{order.customer?.name || (order as any).customer_name || 'Unknown'}</p>
          </div>
          <div className="w-px bg-slate-200"></div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              {isException ? 'Failed Shipments' : 'Drop points'}
            </p>
            <p className={`text-[13px] font-bold ${isException ? 'text-red-600' : 'text-slate-900'}`}>
              {isException ? order.failed_shipments?.length : `${order.total_delivered || 0} / ${order.total_shipment || 0}`}
            </p>
          </div>
        </div>

        {/* Special Notes if available */}
        {order.special_instructions && !isException && (
          <div className="p-4 bg-transparent rounded-2xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Special Instruction</p>
            <p className="text-[13px] font-medium text-slate-900">{order.special_instructions}</p>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            {isException ? 'Failed Shipment Routing' : 'Shipment Routing'}
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Waypoints Timeline */}
        <div className="relative pt-2">
          {isLoading ? (
            <div className="text-center py-8">
               <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-2"></div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimizing Route...</p>
            </div>
          ) : displayWaypoints.length > 0 ? (
            <>
               <div className="absolute left-2.5 top-3 bottom-0 w-[2px] bg-slate-300"></div>

               {displayWaypoints.map((wp: any, idx: number) => {
                  const isLast = idx === displayWaypoints.length - 1;
                  const isPickup = wp.type?.toLowerCase().includes('pickup');
                  const isFailed = !!wp.failed_reason;
                  const color = isFailed ? 'red' : isPickup ? 'emerald' : 'blue';

                  return (
                    <div className={`relative pl-12 ${isLast ? '' : 'pb-6'}`} key={idx}>
                       <div className={`absolute -left-2 top-0 w-9 h-9 rounded-xl flex items-center justify-center z-10 bg-${color}-50`}>
                         <MapPin size={18} className={`text-${color}-500`} strokeWidth={2.5} />
                       </div>

                       <div className="flex flex-col pt-1">
                          <div className="flex justify-between items-start gap-4 w-full">
                            <div className="flex-1 min-w-0">
                               <h3 className="text-[13px] font-bold text-slate-900 mb-0.5 leading-none">{wp.location_name}</h3>
                               <p className="text-[11px] text-slate-600 mb-1.5 truncate max-w-full">{wp.address}</p>
                               {isFailed && (
                                 <p className="text-[10px] font-bold text-red-500 mb-1.5 leading-tight">Reason: {wp.failed_reason}</p>
                               )}
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${isFailed ? 'bg-red-50 text-red-600 border-red-200' : `bg-${color}-50 text-${color}-600 border-${color}-100`}`}>
                                 {isFailed ? 'FAILED' : wp.type}
                               </span>
                            </div>
                          </div>
                       </div>
                    </div>
                  );
               })}
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm italic">No routing sequence available.</div>
          )}
        </div>
      </div>

      {/* Exception Order Level Actions */}
      {isException && (
        <div className="bg-white border-t border-red-100 px-6 py-4 mt-auto">
          <div className="flex gap-3">
             <button className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
               <RotateCcw size={16} strokeWidth={2.5} />
               Return
             </button>
             <button className="flex-[1.5] py-2.5 px-4 rounded-xl relative overflow-hidden group border border-red-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
               <div className="absolute inset-0 bg-red-500 group-hover:bg-red-600 transition-colors"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 group-hover:from-red-600 group-hover:to-red-500 transition-colors opacity-90 block"></div>
               <span className="relative z-10 flex flex-row items-center gap-2">
                 <Truck size={16} strokeWidth={2.5} className="text-red-50" />
                 Redeliver
               </span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

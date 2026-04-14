import React from 'react';
import { X, MapPin, MessageCircle, Truck, User } from 'lucide-react';
import dayjs from 'dayjs';

interface TripDetailFloatingCardProps {
  load: any;
  onClose: () => void;
}

export const TripDetailFloatingCard: React.FC<TripDetailFloatingCardProps> = ({ load, onClose }) => {
  const orderNumber = load?.order?.order_number || load?.trip_number || 'Unknown';
  const orderType = load?.order?.order_type || 'N/A';
  const createdAt = load?.order?.created_at || load?.created_at;
  const createdBy = load?.order?.created_by || load?.created_by;
  const status = load?.status;

  const isFTL = orderType === 'FTL';
  const badgeColors = isFTL
    ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50'
    : 'bg-violet-100/80 text-violet-700 border-violet-200/50';

  const waypoints = load?.trip_waypoints || [];
  const completedCount = waypoints.filter((wp: any) => wp.status === 'completed').length;
  // Progress height roughly estimated based on completed nodes:
  const progressPercent = waypoints.length > 1 ? (completedCount / (waypoints.length - 1)) * 100 : 0;
  // Ensure it doesn't overflow if 100% completed
  const finalProgress = progressPercent > 100 ? 100 : progressPercent;

  const specialInstructions = load?.order?.special_instructions || load?.notes;
  const isActive = status === 'on_delivery' || status === 'in_transit' || status === 'dispatched';

  return (
    <div className="absolute top-6 left-6 w-[400px] bg-white/95 backdrop-blur-md rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden z-20 flex flex-col max-h-[calc(100vh-48px)]">
      {/* Header Actions */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-center bg-white/50 border-b border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] tracking-widest border shrink-0 ${badgeColors}`}>
            {orderType}
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

      {/* Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-8 space-y-4 scrollbar-hide">
        {/* Top Info Stack */}
        <div className="space-y-3">
          {/* Customer & Progress */}
          <div className="p-4 bg-transparent rounded-2xl border border-slate-200 flex gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Customer</p>
              <p className="text-[13px] font-bold text-slate-900 truncate">{load?.order?.customer?.name || 'Unknown'}</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Drop points</p>
              <p className="text-[13px] font-bold text-slate-900">{load?.order?.total_delivered || 0} / {load?.order?.total_shipment || 0}</p>
            </div>
          </div>

          {/* Conditional Top Row: Instructions for Active Trips OR Timestamps for history */}
          {isActive ? (
             specialInstructions && (
               <div className="p-4 bg-transparent rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Special Instruction</p>
                  <p className="text-[13px] font-medium text-slate-900 line-clamp-2">{specialInstructions}</p>
               </div>
             )
          ) : (
             <div className="p-4 bg-transparent rounded-2xl border border-slate-200 flex gap-4">
               <div className="flex-1">
                 <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Started At</p>
                 <p className="text-[13px] font-bold text-slate-900">
                   {load?.started_at ? dayjs(load.started_at).format('DD MMM • HH:mm') : '-'}
                 </p>
               </div>
               <div className="w-px bg-slate-200"></div>
               <div className="flex-1 text-right">
                 <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider text-right">Finished At</p>
                 <p className="text-[13px] font-bold text-slate-900">
                   {load?.completed_at ? dayjs(load.completed_at).format('DD MMM • HH:mm') : '-'}
                 </p>
               </div>
             </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Trip Timeline</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Timeline */}
        <div className="relative pt-2">
          {waypoints.length > 0 ? (
            <>
              <div className="absolute left-2.5 top-3 bottom-0 w-[2px] bg-slate-300">
                <div className="absolute top-0 left-0 w-full bg-slate-200 transition-all duration-500" style={{ height: `${finalProgress}%` }}></div>
              </div>

              {waypoints.map((wp: any, idx: number) => {
                const isCompleted = wp.status === 'completed';
                const isLast = idx === waypoints.length - 1;
                const isPickup = wp.type?.toLowerCase().includes('pickup');
                const isFailed = !!wp.failed_reason;
                const color = isPickup ? 'emerald' : 'blue';

                return (
                  <div className={`relative pl-12 ${isLast ? '' : 'pb-6'}`} key={wp.id || idx}>
                    <div className={`absolute -left-2 top-0 w-9 h-9 rounded-xl flex items-center justify-center z-10 bg-${color}-50`}>
                      <MapPin size={18} className={`text-${color}-500 ${isCompleted || isFailed ? 'opacity-100' : 'opacity-40'}`} strokeWidth={2.5} />
                    </div>

                    <div className="flex justify-between items-start gap-4 pt-1 w-full">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-slate-900 mb-0.5 leading-none">{wp.location_name}</h3>
                        <p className="text-[11px] text-slate-600 mb-1.5 truncate max-w-full">{wp.address || wp.address_rel?.address}</p>
                        {isFailed && wp.failed_reason && (
                          <p className="text-[10px] font-bold text-rose-500 mb-1.5 leading-tight">Reason: {wp.failed_reason}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${isFailed
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : (isCompleted
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-50 text-slate-400 border-slate-100')
                          }`}>
                          {isFailed ? 'FAILED' : wp.status}
                        </span>
                        
                        {wp.actual_completion_time ? (
                          <p className="text-[10px] font-semibold text-slate-400 leading-none">{dayjs(wp.actual_completion_time).format('DD MMM • HH:mm')}</p>
                        ) : (
                          <p className="text-[10px] font-semibold text-slate-400 italic leading-none">{dayjs(wp.completion_at).format('HH:mm A')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm italic">No waypoints defined for this trip.</div>
          )}
        </div>
      </div>

      {/* Optimized Fixed Footer (Driver & Vehicle) */}
      <div className="bg-white border-t border-slate-100 px-6 py-3.5 mt-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Driver Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-slate-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[12px] font-bold text-slate-900 leading-tight truncate">{load?.driver?.name || 'Unassigned'}</h4>
              <p className="text-[10px] text-slate-500 font-medium truncate">{load?.driver?.phone || 'No phone'}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 border-l border-slate-100 pl-4">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Truck size={14} className="text-slate-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[12px] font-bold text-slate-900 leading-tight truncate">{load?.vehicle?.plate_number || 'No Vehicle'}</h4>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase">{load?.vehicle?.type || '-'}</p>
            </div>
          </div>
        </div>

        {/* Action Pack */}
        <div className="flex items-center pl-2 shrink-0">
          <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary transition-colors hover:text-white shadow-sm ring-1 ring-primary/20">
            <MessageCircle size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

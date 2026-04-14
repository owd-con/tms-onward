import React from 'react';
import { Package, Weight, Combine, ArrowRight, UserPlus } from 'lucide-react';
import type { Order } from '@/services/types';
import dayjs from 'dayjs';

interface OrderLoadCardProps {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
  onAssign?: () => void;
}

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || dateStr === '0001-01-01T00:00:00Z') return 'Unscheduled';
  const date = dayjs(dateStr).format('DD/MM/YYYY');
  const time = timeStr ? timeStr.substring(0, 5) : '';
  return time ? `${date} • ${time}` : date;
};

export const OrderLoadCard: React.FC<OrderLoadCardProps> = ({ order, isSelected, onClick, onAssign }) => {
  const firstShipment = order.shipments?.[0];
  const lastShipment = order.shipments?.[(order.shipments?.length || 1) - 1];
  
  const originName = firstShipment?.origin_location_name || 'TBD';
  const destinationName = lastShipment?.dest_location_name || 'TBD';
  const customerName = order.customer?.name || 'Unknown Customer';
  
  // Aggregate data
  const totalWeight = order.shipments?.reduce((acc, curr) => acc + (curr.total_weight || 0), 0) || 0;
  
  const uniqueOrigins = new Set(order.shipments?.map(s => s.origin_address_id)).size || 0;
  const uniqueDestinations = new Set(order.shipments?.map(s => s.destination_address_id)).size || 0;
  
  const originExtra = uniqueOrigins > 1 ? uniqueOrigins - 1 : 0;
  const destExtra = uniqueDestinations > 1 ? uniqueDestinations - 1 : 0;

  const pickupDateTime = formatDateTime(firstShipment?.scheduled_pickup_date, firstShipment?.scheduled_pickup_time);
  const deliveryDateTime = formatDateTime(lastShipment?.scheduled_delivery_date, lastShipment?.scheduled_delivery_time);

  const isFTL = order.order_type === 'FTL';
  const badgeColors = isFTL 
    ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50' 
    : 'bg-violet-100/80 text-violet-700 border-violet-200/50';

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-[20px] p-5 cursor-pointer transition-all border block ${
        isSelected 
          ? 'border-primary shadow-lg shadow-primary/20 ring-1 ring-primary' 
          : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] tracking-widest border ${badgeColors}`}>
            {order.order_type || 'LTL'}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-[16px] tracking-tight block">{order.order_number}</span>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="flex items-center gap-3 mb-5 px-1">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 truncate">
            {originName}
            {originExtra > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase inline-block align-middle mb-0.5">+{originExtra}</span>}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mb-1 truncate">{pickupDateTime}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400 shrink-0 mx-1">
          <ArrowRight className="size-[14px]" strokeWidth={3} />
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="text-[13px] font-bold text-slate-900 truncate">
            {destExtra > 0 && <span className="mr-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase inline-block align-middle mb-0.5">+{destExtra}</span>}
            {destinationName}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mb-1 truncate">{deliveryDateTime}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dest</p>
        </div>
      </div>

      {/* Load Details Metrics */}
      <div className="flex bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-5 text-center">
        <div className="flex-1 border-r border-slate-200/60 pl-1">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Pickups</p>
          <p className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
             <Package className="size-[14px] text-slate-400"/> {uniqueOrigins}
          </p>
        </div>
        <div className="flex-1 border-r border-slate-200/60 pl-1">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Drops</p>
          <p className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
             <Combine className="size-[14px] text-slate-400"/> {uniqueDestinations}
          </p>
        </div>
        <div className="flex-1 pl-1">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Weight</p>
          <p className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
             <Weight className="size-[14px] text-slate-400"/> {totalWeight} <span className="text-[10px] text-slate-400">kg</span>
          </p>
        </div>
      </div>

      {/* Separator line */}
      <div className="h-px w-full bg-slate-100 mb-4"></div>

      {/* Customer / Action */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] tracking-widest shadow-sm">
            {customerName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 leading-none mb-1 truncate max-w-[100px]">{customerName}</p>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 leading-none">Customer</p>
          </div>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onAssign?.();
          }} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-sm">
          <UserPlus className="size-[14px]" strokeWidth={2.5}/> Assign
        </button>
      </div>
    </div>
  );
};

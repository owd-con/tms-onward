import React from 'react';
import { Truck, RotateCcw, MapPin } from 'lucide-react';
import type { Order } from '@/services/types';

interface ExceptionLoadCardProps {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
  onAssign?: () => void;
}

export const ExceptionLoadCard: React.FC<ExceptionLoadCardProps> = ({ order, isSelected, onClick, onAssign }) => {
  const customerName = order.customer?.name || (order as any).customer_name || 'Unknown Customer';

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-[20px] p-5 cursor-pointer transition-all border block ${
        isSelected 
          ? 'border-red-400 shadow-lg shadow-red-500/20 ring-1 ring-red-400' 
          : 'border-red-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-red-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] tracking-widest border bg-red-100/80 text-red-700 border-red-200/50">
            {order.order_type || 'LTL'}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-[16px] tracking-tight block">{order.order_number}</span>
          </div>
        </div>
      </div>

      {/* Failed Shipments List */}
      <div className="flex flex-col gap-2 mb-4">
        {order.failed_shipments?.map((shipment, idx) => (
          <div key={shipment.id || idx} className="flex items-start justify-between bg-red-50/40 border border-red-100 p-3 rounded-xl gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-red-200/50">
               <MapPin size={16} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
               <span className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5 truncate">
                 {shipment.dest_location_name || shipment.dest_location || 'Unknown Destination'}
               </span>
               <span className="text-[11px] font-medium text-red-500 truncate mt-0.5 block">
                 {shipment.failed_reason || 'Delivery Failed'}
               </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); /* TODO handle return */ }} 
              className="flex items-center justify-center h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-all shadow-sm text-[11px] font-bold whitespace-nowrap mt-0.5"
            >
              <RotateCcw size={13} strokeWidth={2.5} className="mr-1.5 text-slate-400"/> Return
            </button>
          </div>
        ))}
      </div>

      {/* Separator line */}
      <div className="h-px w-full bg-slate-100 mb-4"></div>

      {/* Customer / Action */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-100/50 text-red-600 flex items-center justify-center font-bold text-[11px] tracking-widest shadow-sm">
            {customerName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 leading-none mb-1 truncate max-w-[100px]">{customerName}</p>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 leading-none">Customer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onAssign?.();
            }} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm">
            <Truck size={14} strokeWidth={2.5}/> Redeliver
          </button>
        </div>
      </div>
    </div>
  );
};

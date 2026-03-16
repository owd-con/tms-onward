import { Package } from "lucide-react";
import type { DashboardOrderTrip } from "@/services/types";
import clsx from "clsx";

interface ActiveOrdersCardProps {
  orders: DashboardOrderTrip[];
}

const getStatusStyles = (status: string | undefined | null) => {
  if (!status) return "bg-slate-100 text-slate-700 border-slate-200 outline-slate-100";
  const s = status.toUpperCase();
  
  if (["COMPLETED", "ON_TRACK", "DELIVERED", "DONE"].includes(s)) 
    return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100";
    
  if (["IN_TRANSIT", "RUNNING"].includes(s)) 
    return "bg-indigo-50 text-indigo-700 border-indigo-200 outline-indigo-100";
    
  if (["DISPATCHED", "ACTIVE", "IN_PROGRESS"].includes(s)) 
    return "bg-cyan-50 text-cyan-700 border-cyan-200 outline-cyan-100";
    
  if (["PLANNED", "SCHEDULED"].includes(s)) 
    return "bg-purple-50 text-purple-700 border-purple-200 outline-purple-100";
    
  if (["PENDING", "CREATED", "DRAFT"].includes(s)) 
    return "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100";
    
  if (["DELAYED", "FAILED", "CANCELLED", "ERROR", "REJECTED"].includes(s)) 
    return "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100";
    
  return "bg-slate-100 text-slate-700 border-slate-200 outline-slate-100";
};

import { useNavigate } from "react-router-dom";

export default function ActiveOrdersCard({ orders }: ActiveOrdersCardProps) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col h-full min-h-[500px] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-50 bg-slate-50/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
             <Package size={20} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Orders</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-500 bg-white border border-gray-200/60 shadow-sm px-3 py-1 rounded-full">
             {orders.length} Ongoing
           </span>
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1 bg-white">
        {orders.length === 0 ? (
          <div className="text-[14px] font-medium text-slate-400 py-12 text-center flex flex-col items-center justify-center h-full">
            <div className="p-5 bg-slate-50 rounded-full mb-4">
              <Package size={28} className="text-slate-300" strokeWidth={2} />
            </div>
            <p className="text-slate-600 font-semibold">No active orders</p>
            <p className="text-xs mt-1">There are currently no orders in transit.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-y border-gray-100">
                <tr>
                  <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Detail</th>
                  <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Progress</th>
                  <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr 
                    key={order.order_id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/a/orders/${order.order_id}`)}
                  >
                    
                    {/* Order Detail */}
                    <td className="py-4 px-5 w-[220px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[13px] font-bold text-slate-800">{order.order_number}</span>
                        <span className="text-[11px] font-medium text-slate-400">ID: {order.order_id?.split('-')[0] || '-'}</span>
                      </div>
                    </td>
                    
                    {/* Customer Info */}
                    <td className="py-4 px-5 max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-semibold text-slate-900 truncate flex items-center gap-2">
                          {order.customer_name} 
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded uppercase">{order.order_type}</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 truncate">
                          Created: {order.created_at ? order.created_at.split(' ')[0] : '-'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Shipments Info */}
                    <td className="py-4 px-5 w-[140px] text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[14px] font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-lg border border-indigo-100">
                          {order.total_delivered || 0} / {order.total_shipment || 0}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Delivered</span>
                      </div>
                    </td>
                    
                    {/* Status Badge */}
                    <td className="py-4 px-5 text-right w-[120px]">
                      <span className={clsx(
                        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border outline outline-2 outline-offset-1 shadow-sm uppercase",
                        getStatusStyles(order.status)
                      )}>
                        {order.status}
                      </span>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

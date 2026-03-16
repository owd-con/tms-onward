import { Truck, Package } from "lucide-react";
import type { DashboardActiveTrip, DashboardOrderTrip } from "@/services/types";
import clsx from "clsx";

interface ActiveDispatchesFeedProps {
  trips: DashboardActiveTrip[];
  orders: DashboardOrderTrip[];
}

const getStatusColor = (status: string | undefined | null) => {
  if (!status) return "bg-slate-100 text-slate-700";
  const s = status.toUpperCase();
  if (["COMPLETED", "ON_TRACK", "DELIVERED", "DONE"].includes(s)) return "bg-emerald-50 text-emerald-700";
  if (["IN_PROGRESS", "DISPATCHED", "ACTIVE", "RUNNING"].includes(s)) return "bg-indigo-50 text-indigo-700";
  if (["PENDING", "SCHEDULED", "CREATED", "DRAFT"].includes(s)) return "bg-amber-50 text-amber-700";
  if (["DELAYED", "FAILED", "CANCELLED", "ERROR", "REJECTED"].includes(s)) return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

export default function ActiveDispatchesFeed({ trips, orders }: ActiveDispatchesFeedProps) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col mt-0 h-full min-h-[500px] overflow-hidden">
       <div className="flex items-center gap-2.5 p-6 border-b border-gray-50 shrink-0">
          <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
          <h3 className='text-lg font-bold text-slate-900 tracking-tight'>Active Operations</h3>
       </div>
       
       <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 min-h-0 divide-y xl:divide-y-0 xl:divide-x divide-gray-50">
          
          {/* Active Trips Table */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between p-5 border-b border-gray-50 bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-2.5">
                 <div className="p-1.5 bg-white shadow-sm rounded-lg border border-gray-100 text-slate-500">
                    <Truck size={16} strokeWidth={2.5} />
                 </div>
                 <span className="text-[13px] font-bold text-slate-800 tracking-tight">Active Trips</span>
               </div>
               <span className="text-[11px] font-bold text-slate-500 bg-white border border-gray-200/60 shadow-sm px-2.5 py-0.5 rounded-full">{trips.length}</span>
            </div>
            
            <div className="overflow-auto custom-scrollbar flex-1 bg-white">
              {trips.length === 0 ? (
                <div className="text-[14px] font-medium text-slate-400 py-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <Truck size={24} className="text-slate-300" strokeWidth={2} />
                  </div>
                  No active trips found
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50">Trip ID</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50">Resource</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50">Progress</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {trips.map(trip => (
                      <tr key={trip.trip_id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                        <td className="py-4 px-5 w-[110px]">
                          <span className="font-mono text-[13px] font-bold text-slate-700">{trip.trip_number}</span>
                        </td>
                        <td className="py-4 px-5 max-w-[150px]">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-slate-900 truncate">{trip.driver_name}</span>
                            <span className="text-[11px] font-medium text-slate-500 mt-0.5">{trip.vehicle_plate}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 w-[100px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-slate-700">{trip.completed_waypoints}/{trip.total_waypoints}</span>
                              <span className="text-slate-400">Stops</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(0, (trip.completed_waypoints / (trip.total_waypoints || 1)) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={clsx(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide",
                            getStatusColor(trip.status)
                          )}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* Active Orders Table */}
          <div className="flex flex-col min-h-0">
             <div className="flex items-center justify-between p-5 border-b border-gray-50 bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-2.5">
                 <div className="p-1.5 bg-white shadow-sm rounded-lg border border-gray-100 text-slate-500">
                    <Package size={16} strokeWidth={2.5} />
                 </div>
                 <span className="text-[13px] font-bold text-slate-800 tracking-tight">Active Orders</span>
               </div>
               <span className="text-[11px] font-bold text-slate-500 bg-white border border-gray-200/60 shadow-sm px-2.5 py-0.5 rounded-full">{orders.length}</span>
            </div>
            
            <div className="overflow-auto custom-scrollbar flex-1 bg-white">
              {orders.length === 0 ? (
                <div className="text-[14px] font-medium text-slate-400 py-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <Package size={24} className="text-slate-300" strokeWidth={2} />
                  </div>
                  No active orders found
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50">Order ID</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50">Details</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50 text-right">Trip Ref</th>
                      <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50/50 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {orders.map(order => (
                      <tr key={order.order_id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                        <td className="py-4 px-5 w-[110px]">
                          <span className="font-mono text-[13px] font-bold text-slate-700">{order.order_number}</span>
                        </td>
                        <td className="py-4 px-5 max-w-[180px]">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-slate-900 truncate">{order.customer_name}</span>
                            <span className="text-[11px] font-medium text-slate-500 mt-0.5 inline-flex items-center gap-1">
                              {order.order_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {order.trip_number ? (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-50/80 px-2 py-1 rounded border border-gray-100">{order.trip_number}</span>
                          ) : (
                            <span className="text-[11px] text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={clsx(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide",
                            getStatusColor(order.status)
                          )}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
       </div>
    </div>
  );
}

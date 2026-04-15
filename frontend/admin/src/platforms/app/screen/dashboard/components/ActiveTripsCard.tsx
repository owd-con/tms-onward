import { Truck } from "lucide-react";
import type { DashboardActiveTrip } from "@/services/types";
import clsx from "clsx";

interface ActiveTripsCardProps {
  trips: DashboardActiveTrip[];
}

const getStatusStyles = (status: string | undefined | null) => {
  if (!status)
    return "bg-slate-100 text-slate-700 border-slate-200 outline-slate-100";
  const s = status.toUpperCase();
  if (["COMPLETED", "ON_TRACK", "DELIVERED", "DONE"].includes(s))
    return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100";
  if (["IN_PROGRESS", "DISPATCHED", "ACTIVE", "RUNNING"].includes(s))
    return "bg-indigo-50 text-indigo-700 border-indigo-200 outline-indigo-100";
  if (["PENDING", "SCHEDULED", "CREATED", "DRAFT"].includes(s))
    return "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100";
  if (["DELAYED", "FAILED", "CANCELLED", "ERROR", "REJECTED"].includes(s))
    return "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100";
  return "bg-slate-100 text-slate-700 border-slate-200 outline-slate-100";
};

import { useNavigate } from "react-router-dom";

export default function ActiveTripsCard({ trips }: ActiveTripsCardProps) {
  const navigate = useNavigate();
  return (
    <div className='bg-white border border-gray-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col h-full min-h-[400px] overflow-hidden'>
      <div className='flex items-center justify-between p-5 border-b border-gray-50 bg-slate-50/30 shrink-0'>
        <div className='flex items-center gap-2.5'>
          <div className='p-1.5 bg-indigo-50 text-indigo-600 rounded-xl'>
            <Truck size={20} strokeWidth={2.5} />
          </div>
          <h3 className='text-base font-bold text-slate-900 tracking-tight'>
            Active Trips
          </h3>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-bold text-slate-500 bg-white border border-gray-200/60 shadow-sm px-2.5 py-0.5 rounded-full'>
            {trips.length} Ongoing
          </span>
        </div>
      </div>

      <div className='overflow-auto custom-scrollbar flex-1 bg-white'>
        {trips.length === 0 ? (
          <div className='text-[13px] font-medium text-slate-400 py-10 text-center flex flex-col items-center justify-center h-full'>
            <div className='p-4 bg-slate-50 rounded-full mb-3'>
              <Truck size={24} className='text-slate-300' strokeWidth={2} />
            </div>
            <p className='text-slate-600 font-semibold'>No active trips</p>
            <p className='text-xs mt-1'>
              There are currently no trips in progress.
            </p>
          </div>
        ) : (
          <div className='overflow-hidden'>
            <table className='w-full text-left border-collapse'>
              <thead className='bg-slate-50 border-y border-gray-100'>
                <tr>
                  <th className='py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>
                    Trip Detail
                  </th>
                  <th className='py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>
                    Operator Info
                  </th>
                  <th className='py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>
                    Progress
                  </th>
                  <th className='py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {trips.map((trip) => (
                  <tr
                    key={trip.trip_id}
                    className='hover:bg-slate-50/50 transition-colors group cursor-pointer'
                    onClick={() => navigate(`/a/trips/${trip.trip_id}`)}
                  >
                    {/* Trip Detail */}
                    <td className='py-3 px-4 w-[200px]'>
                      <div className='flex flex-col gap-0.5'>
                        <span className='font-mono text-[12px] font-bold text-slate-800'>
                          {trip.trip_number}
                        </span>
                        <span className='text-[10px] font-medium text-slate-400'>
                          ID: {trip.trip_id.split("-")[0]}
                        </span>
                      </div>
                    </td>

                    {/* Operator Info */}
                    <td className='py-3 px-4 max-w-[180px]'>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-[12px] font-semibold text-slate-900 truncate flex items-center gap-1.5'>
                          {trip.driver_name}
                          <span className='text-[9px] bg-slate-100 text-slate-500 px-1 rounded uppercase'>
                            {trip.vehicle_type}
                          </span>
                        </span>
                        <span className='text-[10px] font-medium text-slate-500'>
                          {trip.driver_phone} • {trip.vehicle_plate}
                        </span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className='py-3 px-4 w-[120px]'>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center justify-between text-[10px] font-bold'>
                          <span className='text-indigo-600'>
                            {trip.completed_waypoints}{" "}
                            <span className='text-slate-400 font-medium'>
                              of
                            </span>{" "}
                            {trip.total_waypoints}
                          </span>
                          <span className='text-slate-400'>Waypoints</span>
                        </div>
                        <div className='w-full h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-indigo-500 rounded-full transition-all duration-500'
                            style={{
                              width: `${Math.min(100, Math.max(0, (trip.completed_waypoints / (trip.total_waypoints || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className='py-3 px-4 text-right w-[110px]'>
                      <span
                        className={clsx(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border outline outline-2 outline-offset-1 shadow-sm uppercase",
                          getStatusStyles(trip.status),
                        )}
                      >
                        {trip.status?.replace("_", " ")}
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

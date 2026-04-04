/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  LayoutDashboard,
  Truck,
  CheckCircle,
  Database,
  Package,
  Clock
} from "lucide-react";
import type { Dashboard } from "@/services/types";
import {
  StatCard,
  ShipmentMap,
  ExpiredVehiclesAlert,
  ExpiredDriversAlert,
  FailedOrdersAlert,
  ActiveTripsCard,
  ActiveOrdersCard,
  ShipmentsByTypeCard,
  TopCustomersCard
} from "./components";
import { DatePicker } from "@/components/ui";

import { Page } from "../../components/layout";
import { useDashboard } from "@/services/dashboard/hooks";

// TMS Onward - Dashboard for TMS System

const DashboardScreen = () => {
  const { get, getResult } = useDashboard();

  const [data, setData] = useState<Dashboard | null>(null);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined
  >(undefined);

  useEffect(() => {
    get();
  }, []);

  useEffect(() => {
    if (getResult?.isSuccess) {
      const data = (getResult?.data as any)?.data;
      setData(data);
    }
  }, [getResult]);

  const stats = data?.stats;
  const expiredVehicles = data?.expired_vehicles ?? [];
  const expiredDrivers = data?.expired_drivers ?? [];
  const mapShipments = data?.map_shipments_by_area ?? [];
  const failedOrders = data?.failed_orders ?? [];

  const activeTrips = data?.active_trips ?? [];
  const activeOrders = data?.active_orders ?? [];
  const shipmentsByType = data?.shipments_by_type ?? [];
  const topCustomers = data?.top_customers ?? [];

  return (
    <Page className='h-full flex flex-col min-h-0 bg-slate-50'>
      <div className="flex-1 flex flex-col min-h-0 overflow-auto scrollbar-hide pb-10">
        {/* Greeting Section */}
        <Page.Header
          pillLabel="FLEET OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title="Command Center"
          subtitle="Comprehensive repository of all active fleet dispatches and operational states."
          action={
            <div className="bg-white border border-gray-200/60 rounded-[14px] p-1 shadow-sm font-sans flex items-center">
              <DatePicker
                mode='range'
                placeholder='Filter date range...'
                value={dateRange}
                onChange={(range) => {
                  const newRange =
                    range === null
                      ? undefined
                      : (range as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
                  setDateRange(newRange);
                  const [start, end] = Array.isArray(range)
                    ? range
                    : [null, null];
                  const params: Record<string, string> = {};
                  if (start) params.start_date = start.format("YYYY-MM-DD");
                  if (end) params.end_date = end.format("YYYY-MM-DD");
                  get(params);
                }}
                className='border-none bg-transparent hover:bg-transparent focus:ring-0 text-slate-700 font-medium text-sm h-9'
              />
            </div>
          }
        />

        <div className='flex-1 min-h-0 px-8 pb-8'>
          {getResult?.isLoading ? (
            <div className='flex justify-center items-center h-full'>
              <span className='loading loading-spinner loading-lg text-indigo-600'></span>
            </div>
          ) : (
            <div className="flex flex-col gap-8 h-full">
              {/* Top Row: Premium Metrics Grid */}
              <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 shrink-0'>
                <StatCard
                  label='Total Orders'
                  value={stats?.total_orders ?? "0"}
                  icon={<LayoutDashboard size={20} />}
                  color="indigo"
                />
                <StatCard
                  label='Active Trips'
                  value={stats?.active_trips ?? "0"}
                  icon={<Truck size={20} />}
                  color="blue"
                />
                <StatCard
                  label='Active Orders'
                  value={stats?.active_orders ?? "0"}
                  icon={<Package size={20} />}
                  color="amber"
                />
                <StatCard
                  label='Pending Orders'
                  value={stats?.pending_orders ?? "0"}
                  icon={<Clock size={20} />}
                  color="orange"
                />
                <StatCard
                  label='Completed'
                  value={stats?.completed_orders ?? "0"}
                  icon={<CheckCircle size={20} />}
                  color="emerald"
                />
              </div>

              {/* Middle Section: Operations & Pulse (40/40/20 Split) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-8">
                
                {/* Column 1 (40%): Live Fleet Map & Top Customers */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* Map Card */}
                  <div className="flex flex-col min-h-[500px] h-[750px] xl:h-[650px] bg-white border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden p-6 relative">
                    <div className="flex items-center justify-between mb-5 shrink-0">
                      <div>
                        <h3 className='text-lg font-bold text-slate-900 tracking-tight'>Live Fleet Map</h3>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        LIVE TRACKING
                      </div>
                    </div>
                    
                    <div className="rounded-2xl overflow-hidden border border-gray-100 relative flex-1 min-h-[350px]">
                      {mapShipments.length > 0 ? (
                        <ShipmentMap shipmentsByArea={mapShipments} height='100%' />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-2xl">
                           <p className="text-slate-500 font-medium">No Active Shipments</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Customers Card */}
                  <div className="flex-1 min-h-[300px]">
                     <TopCustomersCard customers={topCustomers} />
                  </div>
                </div>

                {/* Column 2 (40%): Active Orders & Trips */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <ActiveOrdersCard orders={activeOrders} />
                  <ActiveTripsCard trips={activeTrips} />
                </div>

                {/* Column 3 (20%): Stats Breakdown & Attention Required */}
                <div className='lg:col-span-1 flex flex-col gap-6'>
                  {/* Shipments By Type Donut */}
                  <div className="min-h-[350px]">
                     <ShipmentsByTypeCard data={shipmentsByType} />
                  </div>
                  
                  {/* System Logs / Attention Required */}
                  <div className='bg-white border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl flex flex-col min-h-[400px] flex-1'>
                    <div className="flex items-center gap-2 p-6 border-b border-gray-50 shrink-0">
                       <h3 className='text-lg font-bold text-slate-900 tracking-tight'>Attention Required</h3>
                       <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                          {(failedOrders.length || 0) + (expiredVehicles.length || 0) + (expiredDrivers.length || 0)}
                       </span>
                    </div>
                    
                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 p-5">
                      {/* Render new standalone alert cards */}
                      {failedOrders.length > 0 && <FailedOrdersAlert orders={failedOrders} />}
                      {expiredVehicles.length > 0 && <ExpiredVehiclesAlert vehicles={expiredVehicles} />}
                      {expiredDrivers.length > 0 && <ExpiredDriversAlert drivers={expiredDrivers} />}
                      
                      {failedOrders.length === 0 && expiredVehicles.length === 0 && expiredDrivers.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-gray-200 rounded-2xl h-[200px]">
                           <div className="size-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                             <CheckCircle size={20} />
                           </div>
                           <span className="text-[14px] font-bold text-slate-700 mb-1">All Systems Optimal</span>
                           <span className="text-[12px] font-medium text-slate-500">No operational exceptions</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
export default DashboardScreen;

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  LayoutDashboard,
  Truck,
  CheckCircle,
  Database,
  Package,
  Clock,
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
  TopCustomersCard,
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
    <Page className="h-full flex flex-col min-h-0 bg-slate-50">
      <div className="flex flex-col min-h-0 h-full">
        {/* Greeting Section */}
        <Page.Header
          className="!mb-0"
          pillLabel="FLEET OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title="Command Center"
          subtitle="Comprehensive repository of all active fleet dispatches and operational states."
          action={
            <div>
              <DatePicker
                mode="range"
                placeholder="Filter date range..."
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
                className="border-none bg-transparent hover:bg-transparent focus:ring-0 text-slate-700 font-medium text-sm h-9"
              />
            </div>
          }
        />

        <div className="flex-1 min-h-0 overflow-auto scrollbar-hide pb-10">
          {getResult?.isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner loading-lg text-indigo-600"></span>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* MAP HERO: Raw full-bleed, no card, just the map */}
              <div className="relative h-[300px] sm:h-[400px] lg:h-[520px] shrink-0">
                <ShipmentMap shipmentsByArea={mapShipments} height="100%" />

                {/* Floating label - top right */}
                <div className="absolute top-4 right-16 z-20 pointer-events-none">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white bg-slate-900/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-xl">
                    <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    LIVE FLEET MAP
                  </div>
                </div>

                {/* Slim bottom gradient - desktop only */}
                <div className="hidden lg:block absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1e293b] via-[#1e293b]/50 to-transparent pointer-events-none" />
              </div>

              {/* 5-Grid Stat Cards - normal flow on mobile, overlapping on desktop */}
              <div className="relative lg:-mt-10 z-20 px-8 lg:px-8 pt-8 lg:!pt-0 py-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-6">
                  <StatCard
                    label="Total Orders"
                    value={stats?.total_orders ?? "0"}
                    icon={<LayoutDashboard size={20} />}
                    color="indigo"
                  />
                  <StatCard
                    label="Active Trips"
                    value={stats?.active_trips ?? "0"}
                    icon={<Truck size={20} />}
                    color="blue"
                  />
                  <StatCard
                    label="Active Orders"
                    value={stats?.active_orders ?? "0"}
                    icon={<Package size={20} />}
                    color="amber"
                  />
                  <StatCard
                    label="Pending Orders"
                    value={stats?.pending_orders ?? "0"}
                    icon={<Clock size={20} />}
                    color="orange"
                  />
                  <StatCard
                    label="Completed"
                    value={stats?.completed_orders ?? "0"}
                    icon={<CheckCircle size={20} />}
                    color="emerald"
                  />
                </div>
              </div>

              {/* DASHBOARD CONTENT */}
              <div className="px-8 flex flex-col gap-8">
                {/* ROW 3: 2-Column Operations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                  {/* Left Column: Active Orders & Active Trips */}
                  <div className="flex flex-col gap-6">
                    <ActiveOrdersCard orders={activeOrders} />
                    <ActiveTripsCard trips={activeTrips} />
                  </div>

                  {/* Right Column: Top Customers (full) + Analytics & Alerts (2-grid) */}
                  <div className="flex flex-col gap-6">
                    {/* Top Customers - Full Width */}
                    <TopCustomersCard customers={topCustomers} />

                    {/* Sub-grid: Shipments by Type + Attention Required */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipments By Type Donut */}
                      <ShipmentsByTypeCard data={shipmentsByType} />

                      {/* Attention Required */}
                      <div className="bg-white border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl flex flex-col min-h-60">
                        <div className="flex items-center gap-2 p-6 border-b border-gray-50 shrink-0">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            Attention Required
                          </h3>
                          <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                            {(failedOrders.length || 0) +
                              (expiredVehicles.length || 0) +
                              (expiredDrivers.length || 0)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 overflow-y-auto custom-scrollbar flex-1 p-6">
                          {failedOrders.length > 0 && (
                            <FailedOrdersAlert orders={failedOrders} />
                          )}
                          {expiredVehicles.length > 0 && (
                            <ExpiredVehiclesAlert vehicles={expiredVehicles} />
                          )}
                          {expiredDrivers.length > 0 && (
                            <ExpiredDriversAlert drivers={expiredDrivers} />
                          )}

                          {failedOrders.length === 0 &&
                            expiredVehicles.length === 0 &&
                            expiredDrivers.length === 0 && (
                              <div className="flex flex-col items-center justify-center p-8 text-slate-400 border border-dashed border-gray-200 rounded-2xl h-40">
                                <div className="size-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                                  <CheckCircle size={16} />
                                </div>
                                <span className="text-[14px] font-bold text-slate-700 mb-1">
                                  All Systems Optimal
                                </span>
                                <span className="text-[12px] font-medium text-slate-500">
                                  No operational exceptions
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
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

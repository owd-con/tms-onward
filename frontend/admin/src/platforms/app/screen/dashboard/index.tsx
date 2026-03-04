/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import dayjs from "dayjs";

import type { Dashboard } from "@/services/types";
import {
  ShipmentMap,
  StatCard,
  ExpiredVehiclesAlert,
  ExpiredDriversAlert,
  FailedOrdersAlert,
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

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        title='Dashboard'
        titleClassName='!text-2xl'
        subtitle='TMS Onward - Transportation Management System'
      />

      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-6 min-h-0'>
        {getResult?.isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <span className='loading loading-spinner loading-lg'></span>
          </div>
        ) : (
          <div className='overflow-auto scrollbar-hide flex flex-col gap-4'>
            {/* Date Filter */}
            <div className='px-4'>
              <div className='bg-white rounded-xl p-4 shadow-sm'>
                <div className='flex flex-wrap gap-3 items-center'>
                  <label className='text-sm text-gray-600'>
                    Filter by date:
                  </label>
                  <DatePicker
                    mode='range'
                    placeholder='Select date range'
                    value={dateRange}
                    onChange={(range) => {
                      // In range mode, range is either null or [Dayjs | null, Dayjs | null]
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
                    className='w-auto'
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 px-4'>
              <StatCard
                label='Total Orders'
                value={stats?.total_orders ?? "0"}
              />
              <StatCard
                label='Active Trips'
                value={stats?.active_trips ?? "0"}
              />
              <StatCard
                label='Pending Orders'
                value={stats?.pending_orders ?? "0"}
              />
              <StatCard
                label='Completed Orders'
                value={stats?.completed_orders ?? "0"}
              />
            </div>

            {/* Map Section */}
            {mapShipments.length > 0 && (
              <div className='px-4'>
                <div className='bg-white rounded-xl p-4 shadow-sm'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Shipments Map
                  </h3>
                  <ShipmentMap shipmentsByArea={mapShipments} height='450px' />
                </div>
              </div>
            )}

            {/* Alerts Section - Parent fetches data, passes via props */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 px-4'>
              <ExpiredVehiclesAlert vehicles={expiredVehicles} />
              <ExpiredDriversAlert drivers={expiredDrivers} />
            </div>

            {/* Failed Orders - Parent fetches data, passes via props */}
            <FailedOrdersAlert orders={failedOrders} />
          </div>
        )}
      </Page.Body>
    </Page>
  );
};
export default DashboardScreen;

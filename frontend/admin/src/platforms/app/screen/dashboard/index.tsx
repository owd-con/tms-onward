/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDashboard } from "@/services/dashboard/hooks";
import type { Dashboard } from "@/services/types";

import { Page } from "../../components/layout";

// TMS Onward - Dashboard for TMS System

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { get: getDashboard, getResult: getDashboardResult } = useDashboard();

  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    console.log("Dashboard: Fetching data...");
    getDashboard({}).then((result) => {
      console.log("Dashboard: Result", result);
    }).catch((err) => {
      console.error("Dashboard: Error", err);
    });
  }, []);

  useEffect(() => {
    console.log("Dashboard: Result state changed", getDashboardResult);
    if (getDashboardResult?.isSuccess) {
      const response = getDashboardResult?.data as any;
      console.log("Dashboard: Response data", response);
      setData(response?.data ?? null);
    }
  }, [getDashboardResult]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="Dashboard"
        titleClassName="!text-2xl"
        subtitle="TMS Onward - Transportation Management System"
      />

      <Page.Body className="flex-1 flex flex-col space-y-3 lg:space-y-6 min-h-0">
        {getDashboardResult?.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="overflow-auto scrollbar-hide flex flex-col gap-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 p-4">
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-semibold mt-2">
                  {data?.total_orders ?? "0"}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-sm text-gray-500">Active Trips</div>
                <div className="text-2xl font-semibold mt-2">
                  {data?.active_trips ?? "0"}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-sm text-gray-500">Pending Orders</div>
                <div className="text-2xl font-semibold mt-2">
                  {data?.pending_orders ?? "0"}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-sm text-gray-500">Completed Orders</div>
                <div className="text-2xl font-semibold mt-2">
                  {data?.completed_orders ?? "0"}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/a/master-data/customers/create")}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-center"
                >
                  + Add Customer
                </button>
                <button
                  onClick={() => navigate("/a/master-data/vehicles/create")}
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors text-center"
                >
                  + Add Vehicle
                </button>
                <button
                  onClick={() => navigate("/a/master-data/drivers/create")}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors text-center"
                >
                  + Add Driver
                </button>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Welcome to TMS Onward</h3>
              <p className="text-gray-600 mt-2">
                This is the Transportation Management System for logistics companies.
                Manage your orders, trips, drivers, vehicles, and customers from one place.
              </p>
            </div>
          </div>
        )}
      </Page.Body>
    </Page>
  );
};
export default DashboardScreen;

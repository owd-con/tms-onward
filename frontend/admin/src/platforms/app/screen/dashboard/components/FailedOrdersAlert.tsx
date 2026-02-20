import { memo } from "react";

import type { FailedOrder } from "@/services/types";
import { dateFormat } from "@/shared/helper";

export interface FailedOrdersAlertProps {
  orders: FailedOrder[];
  className?: string;
}

export const FailedOrdersAlert = memo<FailedOrdersAlertProps>(
  ({ orders, className }) => {
    if (orders.length === 0) return null;

    return (
      <div className={className}>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="text-lg font-semibold">Failed Orders</h3>
            <span className="badge badge-error badge-sm">{orders.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Order Number</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Failed At</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs px-4 py-3">{order.order_number}</td>
                    <td className="text-xs px-4 py-3">{order.customer_name}</td>
                    <td className="text-xs text-red-600 px-4 py-3">
                      {order.failed_reason || "N/A"}
                    </td>
                    <td className="text-xs px-4 py-3">{dateFormat(order.failed_at, "DD MMM YYYY HH:mm", "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
);

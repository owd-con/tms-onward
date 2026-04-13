/* eslint-disable @typescript-eslint/no-explicit-any */
import config from "@/services/table/const";
import { statusBadge } from "@/shared/helper";
import { dateFormat } from "@/utils/common";
import { FiEye, FiMoreVertical } from "react-icons/fi";

const createTableConfig = ({
  onClick,
}: {
  onClick: (e: any) => void;
}) => ({
  ...config,
  url: "/trips",
  columns: {
    trip_number: {
      title: "Trip Reference",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { trip_number: string }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-gray-900">{row?.trip_number || "-"}</span>
        </div>
      ),
    },
    order: {
      title: "Related Order",
      sortable: false,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { order: any }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-gray-700">
            {row?.order?.order_number || "-"}
          </span>
          <span className="text-[12px] text-gray-500 line-clamp-1">
            {row?.order?.customer?.name || ""}
          </span>
        </div>
      ),
    },
    assignment: {
      title: "Assignment",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { driver: any; vehicle: any }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-emerald-700">{row?.driver?.name || "-"}</span>
          <span className="text-[12px] font-mono font-medium text-gray-500 uppercase">
            {row?.vehicle?.plate_number || "-"}
          </span>
        </div>
      ),
    },
    status: {
      title: "Status",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { status: string }) => {
        return statusBadge(row.status);
      },
    },
    created_at: {
      title: "Scheduled",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { created_at: string }) => (
        <div className="text-[13px] font-medium text-gray-700">
          {dateFormat(row.created_at)}
        </div>
      ),
    },
    actions: {
      title: "Aksi",
      sortable: false,
      headerClass: "capitalize text-center w-[50px]",
      class: "p-4 text-center w-[50px]",
      component: (row: any) => (
        <div className="flex justify-end">
          <div className="dropdown dropdown-end md:dropdown-click" onClick={(e) => e.stopPropagation()}>
            <button
              tabIndex={0}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-[100] menu p-2 shadow-2xl bg-white rounded-2xl w-56 border border-slate-100 mt-2"
            >
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row);
                  }}
                  className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FiEye className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">View Detail</span>
                    <span className="text-[11px] text-slate-400">Track trip & waypoints</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;

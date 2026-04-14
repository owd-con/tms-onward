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
        <div className="flex justify-center">
          <div className="dropdown dropdown-end md:dropdown-click" onClick={(e) => e.stopPropagation()}>
            <button
              tabIndex={0}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 shadow-lg bg-white rounded-xl w-44 border border-gray-100 mt-1"
            >
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-50 hover:text-gray-900 text-gray-700 py-2"
                >
                  <FiEye className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-[13px]">View Detail</span>
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

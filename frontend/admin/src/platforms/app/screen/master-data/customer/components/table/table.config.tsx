/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusToggle } from "@/components/ui";
import config from "@/services/table/const";
import { FiEye, FiMoreVertical, FiMail, FiPhone, FiMapPin, FiActivity } from "react-icons/fi";

const createTableConfig = ({
  onReload,
  onClick,
  filter,
  onToggleStatus,
}: {
  onReload: () => void;
  filter?: Record<string, unknown>;
  onClick: (e: any) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
}) => ({
  ...config,
  url: "/customers",
  onReload,
  filter,
  columns: {
    name: {
      title: "Customer",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { name: string; avatar_url?: string }) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {row?.avatar_url ? (
              <img
                src={row.avatar_url}
                alt={row.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content font-black text-xs ring-2 ring-primary/20 ring-offset-2 ring-offset-white overflow-hidden shadow-sm">
                {row?.name?.substring(0, 2).toUpperCase() || "??"}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-slate-900 truncate">
              {row?.name || "Unknown Customer"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[12px] text-slate-400 font-medium tracking-tight">
                ID: {String(row?.name?.length + 1000) || "---"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    contact: {
      title: "Contact Info",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { email: string; phone: string }) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 group">
            <FiMail className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-[13px] font-medium text-slate-600 truncate max-w-[180px]">
              {row?.email || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 group">
            <FiPhone className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-[12px] text-slate-400 font-medium">
              {row?.phone || "-"}
            </span>
          </div>
        </div>
      ),
    },
    address: {
      title: "Location",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { address: string }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 shrink-0">
            <FiMapPin className="w-3.5 h-3.5" />
          </div>
          <div className="text-[13px] font-medium text-slate-600 line-clamp-1">
            {row?.address || "No address provided"}
          </div>
        </div>
      ),
    },
    is_active: {
      title: "Status",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { is_active: boolean; id: string }) => (
        <div className="flex items-center">
          {onToggleStatus ? (
            <StatusToggle
              checked={row?.is_active ?? false}
              onChange={(checked) => onToggleStatus(row, checked)}
            />
          ) : null}
        </div>
      ),
    },
    actions: {
      title: "",
      sortable: false,
      headerClass: "w-[60px]",
      class: "p-4 text-right w-[60px]",
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
                    <span className="font-bold text-[13px]">View Profile</span>
                    <span className="text-[11px] text-slate-400">Customer details & history</span>
                  </div>
                </button>
              </li>
              <div className="my-1 border-t border-slate-50"></div>
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-3 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <FiActivity className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">Activity Log</span>
                    <span className="text-[11px] text-slate-400">System interactions</span>
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

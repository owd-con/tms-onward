/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusToggle } from "@/components/ui";
import config from "@/services/table/const";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FiEdit2, FiMoreVertical, FiTrash2, FiPhone, FiSmartphone, FiClock } from "react-icons/fi";

dayjs.extend(relativeTime);



const createTableConfig = ({
  onReload,
  onClick,
  filter,
  onToggleStatus,
}: {
  onReload: () => void;
  filter?: Record<string, unknown>;
  onClick: (e: any, action: string) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
}) => ({
  ...config,
  url: "/drivers",
  onReload,
  filter,
  columns: {
    name: {
      title: "Driver",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
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
              {row?.name || "Unknown Driver"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 group cursor-pointer">
              <FiPhone className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[12px] text-slate-400 font-medium tracking-tight">
                {row?.phone || "---"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    license: {
      title: "License",
      sortable: true,
      alias: "license_number",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const type = row?.license_type || "";
        const cleanType = type.replace(/sim_/i, "").toUpperCase();

        const getSimColors = (t: string) => {
          switch (t) {
            case "A":
              return "bg-indigo-600 text-white ring-indigo-500/20";
            case "B1":
              return "bg-amber-600 text-white ring-amber-500/20 shadow-amber-100";
            case "B2":
              return "bg-rose-600 text-white ring-rose-500/20 shadow-rose-100";
            case "C":
              return "bg-emerald-600 text-white ring-emerald-500/20 shadow-emerald-100";
            default:
              return "bg-primary text-primary-content ring-primary/20 shadow-indigo-100";
          }
        };

        const colorClasses = getSimColors(cleanType);

        // Expiry Logic for sub-label
        const expiry = row?.license_expiry ? dayjs(row.license_expiry) : null;
        const now = dayjs();
        const daysToExpiry = expiry ? expiry.diff(now, "day") : null;
        const isExpired = daysToExpiry !== null && daysToExpiry < 0;
        const isExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;

        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ring-2 ring-offset-2 ring-offset-white overflow-hidden shadow-sm transition-all duration-300 ${colorClasses}`}>
              {cleanType || "??"}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-mono font-bold text-slate-700 tracking-tight leading-none">
                {row?.license_number || "---"}
              </span>
              {expiry && (
                <div className="flex flex-col">
                  {isExpired ? (
                    <span className="text-[11px] text-rose-500 font-bold uppercase tracking-wide">
                      Expired {expiry.fromNow()}
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="text-[11px] text-amber-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      {daysToExpiry} days left
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-wide">
                      Expires {expiry.fromNow()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    validity: {
      title: "Validity",
      sortable: true,
      alias: "license_expiry",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        if (!row?.license_expiry) return <span className="text-slate-300 text-[13px] italic">No data</span>;

        const expiry = dayjs(row.license_expiry);
        const now = dayjs();
        const daysToExpiry = expiry.diff(now, "day");
        const isExpired = daysToExpiry < 0;
        const isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 30;

        let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100 shadow-emerald-100/30";
        let statusLabel = "VALID";

        if (isExpired) {
          badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100 shadow-rose-100/30";
          statusLabel = "EXPIRED";
        } else if (isExpiringSoon) {
          badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100 shadow-amber-100/30";
          statusLabel = "WARNING";
        }

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                <FiClock className="w-3 h-3" />
                <span className="text-[13px] font-bold text-slate-600">
                  {expiry.format("MMM D, YYYY")}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border outline outline-2 outline-offset-1 shadow-sm ${badgeStyle}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        );
      },
    },
    status: {
      title: "Status",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
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
    account: {
      title: "Connectivity",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const isAuth = row?.user_id && row?.user_id !== "00000000-0000-0000-0000-000000000000";
        return (
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg shadow-sm border transition-colors ${
              isAuth ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
            }`}>
              <FiSmartphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-bold uppercase tracking-wide ${
                isAuth ? "text-emerald-600" : "text-slate-400"
              }`}>
                {isAuth ? "Device Linked" : "Offline"}
              </span>
              <span className="text-[12px] text-slate-400 font-medium leading-none mt-0.5">
                {isAuth ? "App version 2.4.1" : "No active session"}
              </span>
            </div>
          </div>
        );
      },
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
                    onClick(row, "update");
                  }}
                  className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FiEdit2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">Edit Profile</span>
                    <span className="text-[11px] text-slate-400">Modify license & info</span>
                  </div>
                </button>
              </li>
              <div className="my-1 border-t border-slate-50"></div>
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row, "delete");
                  }}
                  className="flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 text-rose-600 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <FiTrash2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">Remove Driver</span>
                    <span className="text-[11px] text-rose-300">Permanent delete</span>
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

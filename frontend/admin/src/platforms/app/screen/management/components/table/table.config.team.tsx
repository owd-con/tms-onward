/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/services/types";
import config from "@/services/table/const";
import { StatusToggle } from "@/components/ui";
import { dateFormat } from "@/utils/common";
import { FiEdit2, FiMoreVertical, FiTrash2, FiMail, FiPhone } from "react-icons/fi";


const createTableConfig = ({
  canManage,
  onReload,
  onEdit,
  onRemove,
  onToggleStatus,
  filter,
}: {
  canManage: boolean;
  onReload: () => void;
  onEdit: (v: any) => void;
  onRemove: (v: any) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
  filter?: Record<string, unknown>;
}) => ({
  ...config,
  url: "/user",
  filter,
  onReload,
  columns: {
    name: {
      title: "Team Member",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => (
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
              {row?.name || "Unknown Member"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[12px] text-slate-400 font-medium tracking-tight">
                ID: {row?.id?.split("-")[0] || "---"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    role: {
      title: "Role",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => {
        const getRoleStyles = (role: string) => {
          switch (role?.toLowerCase()) {
            case "admin":
              return "bg-indigo-50 text-indigo-700 border-indigo-200 outline-indigo-100 shadow-indigo-100/20";
            case "dispatcher":
              return "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100 shadow-amber-100/20";
            case "driver":
              return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100 shadow-emerald-100/20";
            default:
              return "bg-slate-50 text-slate-700 border-slate-200 outline-slate-100 shadow-slate-100/20";
          }
        };

        return (
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border outline outline-2 outline-offset-1 shadow-sm capitalize ${getRoleStyles(
              row?.role
            )}`}
          >
            {row?.role || "Staff"}
          </span>
        );
      },
    },
    contact: {
      title: "Contact",
      sortable: true,
      alias: 'email',
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 group">
            <div className="p-1 rounded bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
              <FiMail className="w-3 h-3" />
            </div>
            <span className="text-[13px] font-medium text-slate-600 truncate max-w-[180px]">
              {row?.email || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="p-1 rounded bg-slate-50 text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
              <FiPhone className="w-3 h-3" />
            </div>
            <span className="text-[12px] text-slate-500 font-medium">
              {row?.phone || "-"}
            </span>
          </div>
        </div>
      ),
    },

    lastLogin: {
      title: "Last Login",
      sortable: true,
      alias: 'last_login_at',
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => (
        <div className="text-[13px] font-medium text-slate-700">
          {row?.last_login_at ? dateFormat(row.last_login_at) : "Never"}
        </div>
      ),
    },
    joined: {
      title: "Registered",
      sortable: true,
      alias: 'created_at',
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => (
        <div className="text-[13px] font-medium text-slate-700">
          {dateFormat(row?.created_at)}
        </div>
      ),
    },
    status: {
      title: "Status",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: User) => (
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
    action: {
      title: "",
      sortable: false,
      headerClass: "w-[60px]",
      class: "p-4 text-right w-[60px]",
      component: (row: User) =>
        canManage && (
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
                      onEdit(row);
                    }}
                    className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <FiEdit2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-[13px]">Edit Details</span>
                      <span className="text-[11px] text-slate-400">Update profile info</span>
                    </div>
                  </button>
                </li>
                <div className="my-1 border-t border-slate-50"></div>
                <li>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(row);
                    }}
                    className="flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 text-rose-600 py-3 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <FiTrash2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-[13px]">Delete Member</span>
                      <span className="text-[11px] text-rose-300">Permanent removal</span>
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusToggle } from "@/components/ui";
import config from "@/services/table/const";
import { FiEdit2, FiMoreVertical, FiTrash2, FiTruck, FiBox, FiActivity, FiLayers } from "react-icons/fi";
import { LuScale } from "react-icons/lu";

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
  url: "/vehicles",
  onReload,
  filter,
  columns: {
    vehicle: {
      title: "Plate Number",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const type = row?.type?.toLowerCase() || "standard";
        
        const getVehicleIcon = (t: string) => {
          if (t.includes("truck")) return <FiTruck className="w-5 h-5 text-indigo-500" />;
          if (t.includes("van") || t.includes("blind")) return <FiBox className="w-5 h-5 text-emerald-500" />;
          return <FiTruck className="w-5 h-5 text-slate-400" />;
        };

        return (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              {getVehicleIcon(type)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-mono font-black text-slate-900 tracking-tighter leading-none mb-1.5">
                {row?.plate_number || "---"}
              </span>
              <span className="inline-flex self-start px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-slate-900 text-white border border-slate-800 shadow-sm">
                {row?.type || "FTL"}
              </span>
            </div>
          </div>
        );
      },
    },
    make: {
      title: "Model & Make",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700 leading-none mb-1">
             {row?.make || "Generic"}
          </span>
          <span className="text-[12px] text-slate-400 font-medium uppercase tracking-tight truncate">
            {row?.model || "Standard"}
          </span>
        </div>
      ),
    },
    year: {
      title: "Year",
      sortable: true,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { year: number }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
            <FiActivity className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-bold text-slate-700">{row?.year || "---"}</span>
        </div>
      ),
    },
    weight_capacity: {
      title: "Weight",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { capacity_weight: number }) => (
        <div className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
            <LuScale className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-700 leading-none">
              {row?.capacity_weight ? `${row.capacity_weight} kg` : "---"}
            </span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight mt-1">Cap. Weight</span>
          </div>
        </div>
      ),
    },
    volume_capacity: {
      title: "Volume",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: { capacity_volume: number }) => (
        <div className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-100 transition-colors">
            <FiLayers className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-700 leading-none">
              {row?.capacity_volume ? `${row.capacity_volume} m³` : "---"}
            </span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight mt-1">Cap. Volume</span>
          </div>
        </div>
      ),
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
                    <span className="font-bold text-[13px]">Update Vehicle</span>
                    <span className="text-[11px] text-slate-400">Modify info & specs</span>
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
                    <span className="font-bold text-[13px]">Remove Fleet</span>
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

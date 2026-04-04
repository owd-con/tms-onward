import config from "@/services/table/const";
import { FiShield, FiZap, FiTarget, FiActivity } from "react-icons/fi";

const getPerformanceGrade = (rate: number) => {
  if (rate >= 90) return { 
    label: "PLATINUM", 
    color: "text-indigo-600", 
    bg: "bg-indigo-500", 
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 outline-indigo-100 shadow-indigo-100/30",
    icon: <FiShield className="w-3 h-3" />
  };
  if (rate >= 80) return { 
    label: "GOLD", 
    color: "text-emerald-600", 
    bg: "bg-emerald-500", 
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100 shadow-emerald-100/30",
    icon: <FiZap className="w-3 h-3" />
  };
  if (rate >= 60) return { 
    label: "SILVER", 
    color: "text-amber-600", 
    bg: "bg-amber-500", 
    badge: "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100 shadow-amber-100/30",
    icon: <FiTarget className="w-3 h-3" />
  };
  return { 
    label: "AT RISK", 
    color: "text-rose-600", 
    bg: "bg-rose-500", 
    badge: "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100 shadow-rose-100/30",
    icon: <FiActivity className="w-3 h-3" />
  };
};

const createTableConfig = () => ({
  ...config,
  url: "/reports/driver-performance",
  columns: {
    driver: {
      title: "Driver",
      sortable: false,
      alias: "driver_name",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {row?.avatar_url ? (
              <img
                src={row.avatar_url}
                alt={row.driver_name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content font-black text-xs ring-2 ring-primary/20 ring-offset-2 ring-offset-white overflow-hidden shadow-sm uppercase">
                {row?.driver_name?.substring(0, 2).toUpperCase() || "??"}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">
              {row?.driver_name || "---"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-300 font-bold uppercase truncate">
                Professional Operator
              </span>
            </div>
          </div>
        </div>
      ),
    },
    total_trips: {
      title: "Total Trips",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500 w-[150px]",
      class: "p-4 w-[150px]",
      component: (row: any) => (
        <span className="text-[14px] font-bold text-slate-700 px-1">
          {row?.total_trips?.toLocaleString() ?? 0}
        </span>
      ),
    },
    completed: {
      title: "Completed",
      sortable: false,
      alias: "completed_trips",
      headerClass: "capitalize font-semibold text-slate-500 w-[150px]",
      class: "p-4 w-[150px]",
      component: (row: any) => (
        <span className="text-[14px] font-bold text-emerald-600 px-1">
          {row?.completed_trips?.toLocaleString() ?? 0}
        </span>
      ),
    },
    on_time: {
      title: "On-Time",
      sortable: false,
      alias: "on_time_trips",
      headerClass: "capitalize font-semibold text-slate-500 w-[150px]",
      class: "p-4 w-[150px]",
      component: (row: any) => (
        <span className="text-[14px] font-bold text-amber-600 px-1">
          {row?.on_time_trips?.toLocaleString() ?? 0}
        </span>
      ),
    },
    efficiency: {
      title: "On-Time Rate",
      sortable: false,
      alias: "on_time_rate",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex flex-col gap-2 min-w-[120px]">
          <div className="flex items-center justify-between text-[13px] font-black">
            <span className="text-emerald-600">{(row?.on_time_rate || 0).toFixed(0)}%</span>
            <span className="text-[9px] text-slate-300 uppercase tracking-widest">SLA Compliance</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-50 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(row?.on_time_rate || 0, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    performance_grade: {
      title: "Execution Grade",
      sortable: false,
      alias: "on_time_rate",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const grade = getPerformanceGrade(row?.on_time_rate || 0);
        return (
          <div className="flex justify-start">
             <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border outline outline-2 outline-offset-1 shadow-sm transition-all hover:scale-105 cursor-default ${grade.badge}`}>
               <div className={`p-1 rounded-lg bg-white/50 shadow-inner ${grade.color}`}>
                 {grade.icon}
               </div>
               <span className="text-[11px] font-black uppercase tracking-widest">
                 {grade.label}
               </span>
             </div>
          </div>
        );
      },
    },
  },
});

export default createTableConfig;

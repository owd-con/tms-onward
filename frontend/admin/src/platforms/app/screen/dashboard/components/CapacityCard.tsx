import { PieChart } from "lucide-react";

export default function CapacityCard({ ftl, ltl }: { ftl: number; ltl: number }) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between h-[140px]">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-[14px] transition-colors duration-200 bg-sky-50 text-sky-600">
          <PieChart size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-end gap-1 text-[11px] font-bold tracking-tight">
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 leading-none text-right w-full">FTL {ftl}%</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 leading-none text-right w-full">LTL {ltl}%</span>
        </div>
      </div>
      
      <div className="flex flex-col mt-auto gap-1">
        <div className="text-[13px] font-semibold text-slate-500 tracking-wide">
          Max Capacity
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors leading-none">
          {Math.max(ftl, ltl)}<span className="text-sm text-slate-400 ml-1 font-medium">%</span>
        </div>
      </div>
    </div>
  );
}

import { Clock } from "lucide-react";

export default function OnTimeCard({ rate, onTime, late }: { rate: number; onTime: number; late: number }) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between h-[140px]">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-[14px] transition-colors duration-200 bg-teal-50 text-teal-600">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-end gap-1 text-[11px] font-bold tracking-tight">
            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 leading-none text-right w-full">{onTime} On Time</span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 leading-none text-right w-full">{late} Late</span>
        </div>
      </div>
      
      <div className="flex flex-col mt-auto gap-1">
        <div className="text-[13px] font-semibold text-slate-500 tracking-wide">
          On-Time Rate
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors leading-none">
          {rate}<span className="text-sm text-slate-400 ml-1 font-medium">%</span>
        </div>
      </div>
    </div>
  );
}

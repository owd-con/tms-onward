import type { ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  onClick?: () => void;
  color?: "emerald" | "blue" | "orange" | "purple" | "amber" | "indigo";
}

export default function StatCard({ label, value, icon, onClick, color = "emerald" }: StatCardProps) {
  const colorConfig = {
    emerald: { text: "text-emerald-600/30", circle: "bg-emerald-100/60" },
    blue: { text: "text-blue-600/30", circle: "bg-blue-100/60" },
    orange: { text: "text-orange-600/30", circle: "bg-orange-100/60" },
    purple: { text: "text-purple-600/30", circle: "bg-purple-100/60" },
    amber: { text: "text-amber-600/30", circle: "bg-amber-100/60" },
    indigo: { text: "text-indigo-600/30", circle: "bg-indigo-100/60" },
  };

  const { text: textClass, circle: circleClass } = colorConfig[color];

  return (
    <div
      className="relative overflow-hidden bg-white border border-slate-200/60 rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-center h-[100px]"
      onClick={onClick}
    >
      <div className="flex flex-col gap-0.5 relative z-10">
        <div className="text-3xl font-black text-slate-800 tracking-tight transition-colors">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 tracking-wide">
          {label}
        </div>
      </div>

      {/* Decorative background circle with icon */}
      <div className={clsx(
        "absolute -bottom-5 -right-5 w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.6] pointer-events-none",
        circleClass
      )}>
        <div className={clsx("relative scale-[2] transition-transform duration-500 group-hover:-rotate-6", textClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

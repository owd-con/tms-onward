import type { ReactNode } from "react";
import clsx from "clsx";

export interface AlertCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  count?: number;
  color?: "rose" | "orange" | "amber" | "indigo" | "emerald";
  onClick?: () => void;
}

export default function AlertCard({ icon, title, description, count, color = "rose", onClick }: AlertCardProps) {
  const colorConfig = {
    rose: { border: "border-rose-100", bg: "bg-rose-50/40", text: "text-rose-600", textDark: "text-rose-950" },
    orange: { border: "border-orange-100", bg: "bg-orange-50/40", text: "text-orange-600", textDark: "text-orange-950" },
    amber: { border: "border-amber-100", bg: "bg-amber-50/40", text: "text-amber-600", textDark: "text-amber-950" },
    indigo: { border: "border-indigo-100", bg: "bg-indigo-50/40", text: "text-indigo-600", textDark: "text-indigo-950" },
    emerald: { border: "border-emerald-100", bg: "bg-emerald-50/40", text: "text-emerald-600", textDark: "text-emerald-950" },
  };

  const selectedColor = colorConfig[color] || colorConfig.rose;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-start gap-3 p-4 rounded-xl border bg-white shadow-sm transition-shadow",
        selectedColor.border,
        onClick ? "cursor-pointer hover:shadow-md hover:border-slate-300" : "cursor-default hover:shadow"
      )}
    >
      <div className={clsx("shrink-0", selectedColor.text)}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <h4 className={clsx("text-[13px] font-bold tracking-tight", selectedColor.textDark)}>{title}</h4>
        <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      {count !== undefined && count > 0 && (
        <div className="shrink-0 flex items-center justify-center text-[11px] font-bold text-slate-500">
          ({count})
        </div>
      )}
    </div>
  );
}

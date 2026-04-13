import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Package } from "lucide-react";

interface ShipmentsByTypeCardProps {
  data: {
    type: string;
    count: number;
    percent: number;
  }[];
}

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];

export default function ShipmentsByTypeCard({ data }: ShipmentsByTypeCardProps) {
  // Format data for chart
  const chartData = data.map((item, index) => ({
    name: item.type,
    value: item.count,
    percentage: item.percent,
    color: COLORS[index % COLORS.length]
  }));
  
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white border border-gray-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-gray-50 shrink-0">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Shipments by Type</h3>
      </div>

      <div className="p-5 flex flex-col items-center justify-center flex-1">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Package size={28} className="mb-2 opacity-50" />
            <span className="text-xs font-medium">No shipment data available</span>
          </div>
        ) : (
          <>
            <div className="h-[160px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <PipelinesChartTooltip />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none tracking-tighter shadow-sm">{total}</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 w-full">
              {chartData.map((entry, index) => (
                 <div key={index} className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                   <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">{entry.name}</span>
                      <span className="text-[10px] font-medium text-slate-500 leading-tight">{entry.value} ({Math.round(entry.percentage)}%)</span>
                   </div>
                 </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Custom Tooltip
const PipelinesChartTooltip = () => {
  return <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10 flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-[12px] font-bold text-white uppercase tracking-wider">{data.name}</span>
        </div>
        <div className="flex items-end gap-1.5 pl-4">
           <span className="text-xl font-black text-white leading-none">{data.value}</span>
           <span className="text-[11px] font-medium text-slate-400 mb-0.5">Shipments</span>
        </div>
        <div className="pl-4 mt-0.5">
           <span className="text-[11px] font-bold text-indigo-300">{data.percentage.toFixed(1)}% of total</span>
        </div>
      </div>
    );
  }
  return null;
};

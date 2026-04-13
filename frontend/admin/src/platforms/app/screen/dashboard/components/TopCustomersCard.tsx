import { Trophy, Medal, Award, TrendingUp, Presentation } from "lucide-react";

interface TopCustomer {
  customer_id: string;
  customer_name: string;
  total_count: number;
}

interface TopCustomersCardProps {
  customers?: TopCustomer[];
}

export const TopCustomersCard = ({ customers = [] }: TopCustomersCardProps) => {
  const top10 = customers.slice(0, 10);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: "bg-amber-50",
          border: "border-amber-200/60",
          text: "text-amber-700",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          icon: <Trophy size={20} />,
        };
      case 1:
        return {
          bg: "bg-slate-50",
          border: "border-slate-200/60",
          text: "text-slate-700",
          iconBg: "bg-slate-200",
          iconColor: "text-slate-600",
          icon: <Medal size={20} />,
        };
      case 2:
        return {
          bg: "bg-orange-50",
          border: "border-orange-200/60",
          text: "text-orange-800",
          iconBg: "bg-orange-200/50",
          iconColor: "text-orange-700",
          icon: <Award size={20} />,
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-100/60",
          text: "text-slate-600",
          iconBg: "bg-slate-50",
          iconColor: "text-slate-400",
          icon: <span className="font-bold text-[12px]">{index + 1}</span>,
        };
    }
  };

  return (
    <div className="flex flex-col min-h-0 bg-white border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden p-5">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Top Customers</h3>
          <p className="text-[12px] font-medium text-slate-500 mt-0.5">Highest order volume</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
          <TrendingUp size={12} />
          TOP {top10.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {top10.length > 0 ? (
          <div className="flex flex-col gap-2">
            {top10.map((customer, idx) => {
              const style = getRankStyle(idx);
              return (
                <div
                  key={customer.customer_id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${style.border} ${style.bg} transition-all duration-200 hover:shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center ${style.iconBg} ${style.iconColor} font-bold shadow-sm`}
                    >
                      {style.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold text-[12px] ${style.text}`}>
                        {customer.customer_name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 line-clamp-1">
                        ID: {customer.customer_id.split("-")[0]}...
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-black text-slate-800">
                      {customer.total_count}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Orders
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[160px] text-slate-400 border border-dashed border-gray-200 rounded-2xl">
            <div className="size-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <Presentation size={20} />
            </div>
            <span className="text-[13px] font-bold text-slate-700 mb-1">
              No Customers Yet
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Customer order volume will appear here
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Export types for external use
export interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  highlight?: string;
}

export interface AlertCardProps {
  icon: string;
  title: string;
  count: number;
  items: AlertItem[];
}

export function AlertCard({ icon, title, count, items }: AlertCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="badge badge-error badge-sm">{count}</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-red-50 rounded-lg border border-red-100"
          >
            <div className="font-medium text-sm">{item.title}</div>
            {item.subtitle && (
              <div className="text-xs text-gray-600 mt-1">{item.subtitle}</div>
            )}
            {item.highlight && (
              <div className="text-xs text-red-600 mt-1">{item.highlight}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

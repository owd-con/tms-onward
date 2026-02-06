import type { ReactNode } from "react";
import { Button } from "@/components";

interface ReportCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: ReactNode;
  exportButton?: boolean;
  loading?: boolean;
  onExport?: () => void;
  children?: ReactNode;
}

/**
 * TMS Onward - ReportCard Component
 *
 * Reusable card component for displaying report summary.
 * Shows icon, main value, description, and optional export button.
 */
const ReportCard = ({
  title,
  value,
  subtitle,
  icon,
  exportButton = true,
  loading = false,
  onExport,
  children,
}: ReportCardProps) => {
  return (
    <div className="bg-base-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-base-content">{title}</h3>
        </div>
        {exportButton && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onExport}
            disabled={loading}
            className="text-xs"
          >
            Export to Excel
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : (
        <>
          {value !== undefined && (
            <div className="text-3xl font-bold text-base-content mb-2">
              {value}
            </div>
          )}
          {subtitle && (
            <div className="text-sm text-base-content/60 mb-4">{subtitle}</div>
          )}
          {children && <div className="mt-4">{children}</div>}
        </>
      )}
    </div>
  );
};

export default ReportCard;

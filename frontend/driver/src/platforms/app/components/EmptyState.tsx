import { HiCube } from "react-icons/hi2";

interface EmptyStateProps {
  /** Icon element (defaults to HiCube) */
  icon?: React.ReactNode;
  /** Title for the empty state */
  title?: string;
  /** Description message */
  message?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Reusable empty state component
 *
 * Displayed when there's no data to show.
 * Shows icon, title, message, and optional action button.
 */
export const EmptyState = ({
  icon = <HiCube size={32} className="text-slate-400" />,
  title = "No Data",
  message,
  action,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="typo-section-title font-semibold text-content-primary mb-2">
        {title}
      </h3>
      {message && (
        <p className="typo-body text-content-secondary mb-4">
          {message}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

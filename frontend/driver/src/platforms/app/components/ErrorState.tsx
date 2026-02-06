import { Button } from "@/components/ui/button";
import { HiExclamationTriangle } from "react-icons/hi2";
import { HiArrowPath } from "react-icons/hi2";

interface ErrorStateProps {
  /** Error object or message */
  error: Error | unknown;
  /** Title for the error state */
  title?: string;
  /** Custom error message (overrides error.message) */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether retry action is in progress */
  isRetrying?: boolean;
  /** Custom retry button text */
  retryText?: string;
  /** Optional secondary action (e.g., "Go Back") */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * ErrorState - Reusable error state component
 *
 * Displayed when an operation fails.
 * Shows error message with optional retry button and/or secondary action.
 */
export const ErrorState = ({
  error,
  title = "Failed to Load",
  message,
  onRetry,
  isRetrying = false,
  retryText = "Try Again",
  secondaryAction,
}: ErrorStateProps) => {
  const errorMessage = message || (error instanceof Error ? error.message : "An error occurred");

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <HiExclamationTriangle size={32} className="text-red-500" />
      </div>
      <h3 className="typo-section-title font-semibold text-content-primary mb-2">
        {title}
      </h3>
      <p className="typo-body text-content-secondary mb-4">
        {errorMessage}
      </p>
      <div className="flex gap-3 justify-center">
        {secondaryAction && (
          <Button
            variant="secondary"
            size="sm"
            onClick={secondaryAction.onClick}
            className="flex-1 max-w-xs"
          >
            {secondaryAction.label}
          </Button>
        )}
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className={secondaryAction ? "flex-1 max-w-xs gap-2" : "gap-2"}
          >
            <HiArrowPath size={16} className={isRetrying ? "animate-spin" : ""} />
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
};

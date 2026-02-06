import clsx from "clsx";
import { memo } from "react";

// StatusToggle Component - On/Off switch for activate/deactivate feature

// 1. Type definitions
interface StatusToggleProps {
  checked: boolean; // Current active state
  onChange: (checked: boolean) => void; // Toggle handler
  disabled?: boolean; // Disabled for loading or self-deactivate
  loading?: boolean; // Show loading state
  label?: string; // Optional label text
}

// 2. Component dengan memo
export const StatusToggle = memo(({
  checked,
  onChange,
  disabled = false,
  loading = false,
  label,
}: StatusToggleProps) => {
  // 3. Handle toggle
  const handleChange = () => {
    if (!disabled && !loading) {
      onChange(!checked);
    }
  };

  // 4. Visual styling
  const activeColor = checked ? "bg-success" : "bg-base-300";
  const dotPosition = checked ? "translate-x-6" : "translate-x-1";

  // 5. Disabled styling
  const isDisabled = disabled || loading;

  return (
    <div className="flex items-center gap-2">
      {/* Optional label */}
      {label && (
        <span className="text-sm font-medium">
          {label}
        </span>
      )}

      {/* Toggle switch */}
      <button
        type="button"
        onClick={handleChange}
        disabled={isDisabled}
        className={clsx(
          "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200",
          activeColor,
          isDisabled && "cursor-not-allowed opacity-50"
        )}
        aria-label={checked ? "Active" : "Inactive"}
        aria-checked={checked}
        role="switch"
      >
        {/* Dot */}
        <span
          className={clsx(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            dotPosition,
            loading && "animate-pulse"
          )}
        />
      </button>

      {/* Status text */}
      <span className="text-xs font-medium">
        {checked ? (
          <span className="text-success flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Active
          </span>
        ) : (
          <span className="text-base-content/50 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-base-content/50"></span>
            Inactive
          </span>
        )}
      </span>
    </div>
  );
});

StatusToggle.displayName = "StatusToggle";

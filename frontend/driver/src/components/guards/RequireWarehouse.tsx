import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

interface RequireWarehouseProps {
  children: React.ReactNode;
  message?: string; // Custom message untuk placeholder
  fallbackContent?: React.ReactNode; // Custom content jika warehouse belum dipilih
}

export const RequireWarehouse = ({
  children,
  message = "Please select a warehouse from the sidebar to continue",
  fallbackContent,
}: RequireWarehouseProps) => {
  const userProfileWarehouse = useSelector(
    (state: RootState) => state.userProfile?.warehouse
  );

  const warehouseId =
    userProfileWarehouse?.warehouse_id ||
    userProfileWarehouse?.warehouse?.id;

  const hasWarehouse = !!warehouseId;

  // Jika warehouse belum dipilih, tampilkan fallback content atau default message
  if (!hasWarehouse) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-warning opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-base-content">
            Warehouse Selection Required
          </h2>
          <p className="text-base-content/70 mb-4">
            {message}
          </p>
          <div className="alert alert-warning text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Please select a warehouse from the sidebar to view this page.</span>
          </div>
        </div>
      </div>
    );
  }

  // Jika warehouse sudah dipilih, render children
  return <>{children}</>;
};

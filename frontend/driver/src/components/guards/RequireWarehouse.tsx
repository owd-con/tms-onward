interface RequireWarehouseProps {
  children: React.ReactNode;
  message?: string;
  fallbackContent?: React.ReactNode;
}

/**
 * RequireWarehouse Guard - Simplified for Driver App
 *
 * Note: The driver app doesn't use warehouse selection like the admin app.
 * This guard simply renders children as the driver always has a company context.
 */
export const RequireWarehouse = ({
  children,
}: RequireWarehouseProps) => {
  // Driver app always has company context from the authenticated session
  // No warehouse selection needed
  return <>{children}</>;
};

import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/utils/permission";

/**
 * Custom hook untuk permission checking
 * @returns Object dengan helper functions untuk check permissions
 */
export const usePermission = () => {
  const Profile = useSelector((state: RootState) => state.userProfile);
  const userPermissions = Profile?.user?.usergroup?.permissions;
  const isSuperAdmin = !Profile?.user?.usergroup;

  /**
   * Check if user has permission(s)
   * @param permission - Single permission string or array of permissions
   * @returns boolean - true if user has permission OR is super admin
   */
  const can = (permission: string | string[]): boolean => {
    if (isSuperAdmin) return true;
    if (Array.isArray(permission)) {
      return hasAnyPermission(userPermissions, permission);
    }
    return hasPermission(userPermissions, permission);
  };

  /**
   * Check if user has all required permissions (AND logic)
   * @param permissions - Array of permission strings
   * @returns boolean - true if user has all permissions OR is super admin
   */
  const canAll = (permissions: string[]): boolean => {
    if (isSuperAdmin) return true;
    return hasAllPermissions(userPermissions, permissions);
  };

  /**
   * Check if user can manage a module (for create/update/delete actions)
   * @param module - Module name (e.g., "delivery", "receiving plan", "tenant")
   * @returns boolean - true if user has manage permission OR is super admin
   */
  const canManage = (module: string): boolean => {
    if (isSuperAdmin) return true;
    return hasPermission(userPermissions, `svc-warehouse.${module}.manage`);
  };

  /**
   * Check if user can read a module (for view actions)
   * @param module - Module name
   * @returns boolean - true if user has manage or readonly permission OR is super admin
   */
  const canRead = (module: string): boolean => {
    if (isSuperAdmin) return true;
    return hasAnyPermission(userPermissions, [
      `svc-warehouse.${module}.manage`,
      `svc-warehouse.${module}.readonly`,
    ]);
  };

  return {
    can,
    canAll,
    canManage,
    canRead,
    isSuperAdmin,
    userPermissions,
  };
};

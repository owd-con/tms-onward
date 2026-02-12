/**
 * Check if user has required permission
 * @param userPermissions - Array of permission slugs from user's usergroup
 * @param requiredPermission - Permission slug to check
 * @returns boolean - true if user has permission OR if user has no usergroup (super admin)
 */
export const hasPermission = (
  userPermissions: string[] | undefined,
  requiredPermission: string
): boolean => {
  // Jika user tidak punya usergroup (undefined/null), berarti super admin - akses semua
  if (userPermissions === undefined || userPermissions === null) {
    return true;
  }

  // Jika array kosong, berarti tidak punya permission
  if (userPermissions.length === 0) {
    return false;
  }

  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the required permissions (OR logic)
 * @param userPermissions - Array of permission slugs from user's usergroup
 * @param requiredPermissions - Array of permission slugs to check
 * @returns boolean - true if user has any permission OR if user has no usergroup (super admin)
 */
export const hasAnyPermission = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean => {
  // Jika user tidak punya usergroup (undefined/null), berarti super admin - akses semua
  if (userPermissions === undefined || userPermissions === null) {
    return true;
  }

  // Jika array kosong, berarti tidak punya permission
  if (userPermissions.length === 0) {
    return false;
  }

  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

/**
 * Check if user has all required permissions (AND logic)
 * @param userPermissions - Array of permission slugs from user's usergroup
 * @param requiredPermissions - Array of permission slugs to check
 * @returns boolean - true if user has all permissions OR if user has no usergroup (super admin)
 */
export const hasAllPermissions = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean => {
  // Jika user tidak punya usergroup (undefined/null), berarti super admin - akses semua
  if (userPermissions === undefined || userPermissions === null) {
    return true;
  }

  // Jika array kosong, berarti tidak punya permission
  if (userPermissions.length === 0) {
    return false;
  }

  return requiredPermissions.every((perm) => userPermissions.includes(perm));
};

/**
 * Check if user has manage or readonly permission for a module
 * @param userPermissions - Array of permission slugs from user's usergroup
 * @param module - Module name (e.g., "item", "receiving plan", "delivery")
 * @returns boolean - true if user has access OR if user has no usergroup (super admin)
 */
export const hasModuleAccess = (
  userPermissions: string[] | undefined,
  module: string
): boolean => {
  // Jika user tidak punya usergroup (undefined/null), berarti super admin - akses semua
  if (userPermissions === undefined || userPermissions === null) {
    return true;
  }

  // Jika array kosong, berarti tidak punya permission
  if (userPermissions.length === 0) {
    return false;
  }

  const managePerm = `svc-warehouse.${module}.manage`;
  const readonlyPerm = `svc-warehouse.${module}.readonly`;
  return hasAnyPermission(userPermissions, [managePerm, readonlyPerm]);
};

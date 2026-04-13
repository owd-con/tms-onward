/**
 * JWT Utilities for TMS
 * Decode JWT to extract user information from token payload
 */

/**
 * Decode JWT payload without verification (for client-side use)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): any | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Extract user info from TMS JWT token
 * @param tms_token - TMS JWT token
 * @returns User object or null
 */
export const extractUserFromToken = (tms_token?: string): any | null => {
  if (tms_token) {
    const decoded = decodeJWT(tms_token);
    if (decoded) {
      return {
        user_id: decoded.user_id,
        username: decoded.username,
        display_name: decoded.display_name,
        email: decoded.email,
        permission: decoded.permission,
        type: decoded.type,
        role: decoded.role,
        company_id: decoded.company_id,
      };
    }
  }

  return null;
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns true if expired or invalid
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
};

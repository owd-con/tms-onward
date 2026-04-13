// SessionData type removed - not used

/**
 * TMS Onward - SSO Cookie Utilities
 * Reads auth_session cookie from Onward Connect for SSO login
 */

/**
 * Get the appropriate cookie domain
 * @returns {string} 'localhost' for local dev, '.onward.co.id' for production
 */
export const getCookieDomain = (): string => {
  if (typeof window === "undefined") {
    return ".onward.co.id";
  }

  const isLocalhost = window.location.hostname.includes("localhost");
  return isLocalhost ? "localhost" : ".onward.co.id";
};

/**
 * Read auth_session cookie from Onward Connect
 * Expected format: { tms_token, wms_token, selected_system } (user is optional, extracted from JWT)
 * @returns {SessionData | null} Parsed session data or null
 */
export const getConnectSSOCookie = (): {
  user?: any;
  tms_token?: string;
  wms_token?: string;
  selected_system?: string;
} | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_session="),
  );

  if (!authCookie) {
    return null;
  }

  try {
    const value = authCookie.split("=")[1];
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    return parsed;
  } catch (error) {
    return null;
  }
};

/**
 * Extract TMS token from SSO cookie
 * @returns {string | null} TMS access token or null
 */
export const getTMSTokenFromSSO = (): string | null => {
  const ssoData = getConnectSSOCookie();

  if (!ssoData || !ssoData.tms_token) {
    return null;
  }

  return ssoData.tms_token;
};

/**
 * Check if user has valid TMS SSO session
 * @returns {boolean} True if TMS token exists in cookie
 */
export const hasValidTMSSSO = (): boolean => {
  return getTMSTokenFromSSO() !== null;
};

/**
 * Clear all cookies on logout
 */
export const clearSSOCookies = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  const domain = getCookieDomain();
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name] = cookie.split("=");
    const trimmedName = name?.trim();
    if (!trimmedName) continue;

    // Clear cookie with domain
    document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
    // Clear cookie without domain
    document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

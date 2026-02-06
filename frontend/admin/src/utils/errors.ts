/**
 * Error parsing and message extraction utilities
 * Provides functions to extract, format, and check error types
 *
 * @module errors
 */

import { isApiError } from "../services/types/api";

/**
 * Extract user-friendly error message from various error formats
 * Handles ApiError, Error instances, and string errors
 *
 * @param error - Error object of unknown type
 * @returns User-friendly error message string
 * @example
 * ```tsx
 * try {
 *   await apiCall();
 * } catch (err) {
 *   const message = extractErrorMessage(err);
 *   showToast(message);
 * }
 * ```
 */
export function extractErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Try different error message locations
    const errorMessage =
      error.data?.errors?.id ||
      error.data?.message ||
      error.data?.error ||
      error.message;

    if (typeof errorMessage === "string") {
      return errorMessage;
    }

    // If errors is an object, try to get first error
    if (error.data?.errors && typeof error.data.errors === "object") {
      const errors = error.data.errors;
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        const firstError = errors[firstKey];
        if (typeof firstError === "string") {
          return firstError;
        }
        if (Array.isArray(firstError) && firstError.length > 0) {
          return String(firstError[0]);
        }
      }
    }

    // Fallback to status code message
    if (error.status) {
      return getHttpStatusMessage(error.status);
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Default fallback
  return "An unexpected error occurred";
}

/**
 * Get user-friendly HTTP status messages
 * Maps HTTP status codes to readable error messages
 *
 * @param status - HTTP status code
 * @returns User-friendly status message
 */
export function getHttpStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: "Bad Request - Please check your input",
    401: "Unauthorized - Please log in again",
    403: "Forbidden - You don't have permission to access this resource",
    404: "Not Found - The requested resource was not found",
    409: "Conflict - This action conflicts with existing data",
    422: "Validation Error - Please check your input",
    429: "Too Many Requests - Please try again later",
    500: "Server Error - Please try again later",
    502: "Bad Gateway - Service temporarily unavailable",
    503: "Service Unavailable - Please try again later",
    504: "Gateway Timeout - Request took too long",
  };

  return (
    statusMessages[status] ||
    `Error ${status} - An error occurred while processing your request`
  );
}

/**
 * Check if error is a network error (no status code or fetch failure)
 *
 * @param error - Error object to check
 * @returns True if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === undefined || error.status === 0;
  }

  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch")
    );
  }

  return false;
}

/**
 * Check if error is an authentication error (401 Unauthorized or 403 Forbidden)
 *
 * @param error - Error object to check
 * @returns True if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 401 || error.status === 403;
  }

  return false;
}

/**
 * Check if error is a validation error (422)
 */
export function isValidationError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 422;
  }

  return false;
}

/**
 * Get validation errors as a record
 */
export function getValidationErrors(
  error: unknown
): Record<string, string | string[]> | null {
  if (isApiError(error) && error.data?.errors) {
    const errors = error.data.errors;
    if (typeof errors === "object" && errors !== null) {
      return errors as Record<string, string | string[]>;
    }
  }

  return null;
}

/**
 * Format error for display to user with title, message, and optional details
 *
 * @param error - Error object to format
 * @returns Formatted error object with title, message, and optional validation details
 * @example
 * ```tsx
 * const formatted = formatErrorForUser(error);
 * showModal({
 *   title: formatted.title,
 *   message: formatted.message,
 *   details: formatted.details
 * });
 * ```
 */
export function formatErrorForUser(error: unknown): {
  title: string;
  message: string;
  details?: Record<string, string | string[]>;
} {
  const message = extractErrorMessage(error);
  const isNetwork = isNetworkError(error);
  const isAuth = isAuthError(error);
  const validationErrors = getValidationErrors(error);

  let title = "Error";
  if (isNetwork) {
    title = "Network Error";
  } else if (isAuth) {
    title = "Authentication Error";
  } else if (validationErrors) {
    title = "Validation Error";
  }

  return {
    title,
    message,
    details: validationErrors || undefined,
  };
}

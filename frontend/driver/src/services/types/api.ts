/**
 * Core API type definitions for the WMS client application
 */

/**
 * Base API error structure
 */
export interface ApiError {
  status?: number;
  data?: {
    message?: string;
    errors?: {
      id?: string;
      [key: string]: string | string[] | unknown;
    };
    error?: string;
  };
  message?: string;
}

/**
 * API error response from RTK Query
 */
export interface ApiErrorResponse {
  status: number;
  data: {
    message?: string;
    errors?: Record<string, string | string[]>;
    error?: string;
  };
}

/**
 * Base API response structure
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  [key: string]: unknown;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("status" in error || "data" in error)
  );
}

/**
 * Type guard to check if response is a successful API response
 */
export function isApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    ("success" in response || "message" in response || "data" in response)
  );
}

/**
 * Type guard to check if response is a paginated response
 */
export function isPaginatedResponse<T>(
  response: unknown
): response is PaginatedResponse<T> {
  return (
    isApiResponse<T[]>(response) &&
    Array.isArray(response.data) &&
    response.meta !== undefined &&
    typeof response.meta === "object" &&
    response.meta !== null
  );
}

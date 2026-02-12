/**
 * Core API type definitions for the public tracking page
 */

/**
 * Base API error structure
 */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
  /** Additional error details */
  details?: any;
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
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Optional message from the server */
  message?: string;
  /** Indicates if the request was successful */
  success?: boolean;
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
 * For paginated lists
 */
export interface PaginatedResponse<T> {
  /** Array of data items */
  data: T[];
  /** Total number of items */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of pages */
  total_pages: number;
}

/**
 * Type guard to check if an error is an ApiError
 * Helper function for type checking
 */
export function isApiError(error: any): error is ApiError {
  return error && typeof error.status === 'number' && typeof error.message === 'string';
}

/**
 * Type guard to check if an error is a 404 Not Found error
 */
export function isNotFound(error: ApiError): boolean {
  return error.status === 404;
}

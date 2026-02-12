import { fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { logger } from "@/utils/logger";

// Base URL from environment variable with fallback
const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Simplified base query for public tracking (no auth required)
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    logger.apiHeaders(headers);
    return headers;
  },
  responseHandler: async (response) => {
    return response.json();
  },
});

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  const method = typeof args === "object" ? args.method : undefined;
  const body = typeof args === "object" ? args.body : undefined;
  const params = typeof args === "object" ? args.params : undefined;

  // Log request
  logger.apiRequest(url, method, params, body);

  const result = await rawBaseQuery(args, api, extraOptions);

  // Log response
  logger.apiResponse(result);

  // Handle errors with specific messages for common cases
  if (result.error) {
    const status = result.error.status;

    // Network error (e.g., server not reachable)
    if (status === "FETCH_ERROR") {
      logger.error("Network error occurred", result.error);
      return {
        error: {
          status: "FETCH_ERROR",
          data: {
            message:
              "Unable to connect to server. Please check your connection.",
          },
        },
      };
    }

    // 404 - Order not found
    if (status === 404) {
      logger.error("Resource not found", { url, status });
      return {
        error: {
          status: 404,
          data: { message: "Order not found" },
        },
      };
    }

    // 500 - Server error
    if (status === 500) {
      logger.error("Server error occurred", result.error);
      return {
        error: {
          status: 500,
          data: { message: "Server error. Please try again later." },
        },
      };
    }

    // Other errors
    logger.error("API error occurred", result.error);
  }

  return result;
};

import { describe, it, expect } from "vitest";
import {
  extractErrorMessage,
  getHttpStatusMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
  getValidationErrors,
  formatErrorForUser,
} from "./errors";
import type { ApiError } from "../services/types/api";

describe("errors", () => {
  describe("extractErrorMessage", () => {
    it("should extract message from ApiError with errors.id", () => {
      const error: ApiError = {
        data: {
          errors: {
            id: "Test error message",
          },
        },
      };
      expect(extractErrorMessage(error)).toBe("Test error message");
    });

    it("should extract message from ApiError with data.message", () => {
      const error: ApiError = {
        data: {
          message: "Data message",
        },
      };
      expect(extractErrorMessage(error)).toBe("Data message");
    });

    it("should extract message from Error instance", () => {
      const error = new Error("Standard error");
      expect(extractErrorMessage(error)).toBe("Standard error");
    });

    it("should extract message from string error", () => {
      expect(extractErrorMessage("String error")).toBe("String error");
    });

    it("should return default message for unknown error", () => {
      expect(extractErrorMessage({})).toBe("An unexpected error occurred");
    });

    it("should handle errors object with first key", () => {
      const error: ApiError = {
        data: {
          errors: {
            email: "Email is required",
            password: "Password is required",
          },
        },
      };
      expect(extractErrorMessage(error)).toBe("Email is required");
    });
  });

  describe("getHttpStatusMessage", () => {
    it("should return message for 401", () => {
      expect(getHttpStatusMessage(401)).toContain("Unauthorized");
    });

    it("should return message for 404", () => {
      expect(getHttpStatusMessage(404)).toContain("Not Found");
    });

    it("should return message for 500", () => {
      expect(getHttpStatusMessage(500)).toContain("Server Error");
    });

    it("should return generic message for unknown status", () => {
      expect(getHttpStatusMessage(999)).toContain("Error 999");
    });
  });

  describe("isNetworkError", () => {
    it("should return true for error without status", () => {
      const error: ApiError = {};
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return true for error with status 0", () => {
      const error: ApiError = { status: 0 };
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return false for error with status", () => {
      const error: ApiError = { status: 404 };
      expect(isNetworkError(error)).toBe(false);
    });

    it("should return true for Error with network message", () => {
      const error = new Error("Failed to fetch");
      expect(isNetworkError(error)).toBe(true);
    });
  });

  describe("isAuthError", () => {
    it("should return true for 401 error", () => {
      const error: ApiError = { status: 401 };
      expect(isAuthError(error)).toBe(true);
    });

    it("should return true for 403 error", () => {
      const error: ApiError = { status: 403 };
      expect(isAuthError(error)).toBe(true);
    });

    it("should return false for other status codes", () => {
      const error: ApiError = { status: 404 };
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe("isValidationError", () => {
    it("should return true for 422 error", () => {
      const error: ApiError = { status: 422 };
      expect(isValidationError(error)).toBe(true);
    });

    it("should return false for other status codes", () => {
      const error: ApiError = { status: 400 };
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe("getValidationErrors", () => {
    it("should return validation errors object", () => {
      const error: ApiError = {
        status: 422,
        data: {
          errors: {
            email: "Email is invalid",
            password: "Password too short",
          },
        },
      };
      const result = getValidationErrors(error);
      expect(result).toEqual({
        email: "Email is invalid",
        password: "Password too short",
      });
    });

    it("should return null for non-validation error", () => {
      const error: ApiError = { status: 404 };
      expect(getValidationErrors(error)).toBeNull();
    });
  });

  describe("formatErrorForUser", () => {
    it("should format network error", () => {
      const error: ApiError = {};
      const result = formatErrorForUser(error);
      expect(result.title).toBe("Network Error");
      expect(result.message).toBeTruthy();
    });

    it("should format auth error", () => {
      const error: ApiError = { status: 401 };
      const result = formatErrorForUser(error);
      expect(result.title).toBe("Authentication Error");
    });

    it("should format validation error with details", () => {
      const error: ApiError = {
        status: 422,
        data: {
          errors: {
            email: "Invalid email",
          },
        },
      };
      const result = formatErrorForUser(error);
      expect(result.title).toBe("Validation Error");
      expect(result.details).toEqual({ email: "Invalid email" });
    });
  });
});

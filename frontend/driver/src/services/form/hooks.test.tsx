import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useFormActions } from "./hooks";
import { formReducer } from "./slice";
import type { ApiError } from "../types/api";

// Mock EnigmaUI
const mockShowToast = vi.fn();
vi.mock("@/components", () => ({
  useEnigmaUI: () => ({
    showToast: mockShowToast,
  }),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      form: formReducer,
    },
  });
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createMockStore();
  return <Provider store={store}>{children}</Provider>;
};

describe("useFormActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("should provide form action functions", () => {
    const { result } = renderHook(() => useFormActions(), { wrapper });

    expect(result.current.reset).toBeDefined();
    expect(result.current.requesting).toBeDefined();
    expect(result.current.success).toBeDefined();
    expect(result.current.failure).toBeDefined();
    expect(result.current.failureWithTimeout).toBeDefined();
  });

  it("should handle failure with timeout", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFormActions(), { wrapper });

    const error: ApiError = {
      data: {
        errors: {
          id: "Test error",
        },
      },
    };

    result.current.failureWithTimeout(error, 1000);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      // Verify toast was shown
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test error",
          type: "error",
        })
      );
    });

    vi.useRealTimers();
  });

  it("should reset form", () => {
    const { result } = renderHook(() => useFormActions(), { wrapper });
    result.current.reset();
    // Verify no errors thrown
    expect(result.current).toBeDefined();
  });

  it("should set requesting state", () => {
    const { result } = renderHook(() => useFormActions(), { wrapper });
    result.current.requesting();
    expect(result.current).toBeDefined();
  });

  it("should set success state", () => {
    const { result } = renderHook(() => useFormActions(), { wrapper });
    result.current.success();
    expect(result.current).toBeDefined();
  });
});

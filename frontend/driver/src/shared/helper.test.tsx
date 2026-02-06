import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toNum, statusBadge, getOptionByValue, debounce } from "./helper";
import { render } from "@testing-library/react";

describe("helper utilities", () => {
  describe("toNum", () => {
    it("should convert number to number", () => {
      expect(toNum(123)).toBe(123);
    });

    it("should convert valid string to number", () => {
      expect(toNum("123")).toBe(123);
    });

    it("should return null for null", () => {
      expect(toNum(null)).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(toNum(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(toNum("")).toBeNull();
    });

    it("should return null for whitespace string", () => {
      expect(toNum("   ")).toBeNull();
    });

    it("should return null for invalid string", () => {
      expect(toNum("abc")).toBeNull();
    });
  });

  describe("statusBadge", () => {
    it("should render badge for active status", () => {
      const { container } = render(statusBadge("active"));
      expect(container).toBeTruthy();
    });

    it("should render badge for inactive status", () => {
      const { container } = render(statusBadge("inactive"));
      expect(container).toBeTruthy();
    });

    it("should handle uppercase status", () => {
      const { container } = render(statusBadge("ACTIVE"));
      expect(container).toBeTruthy();
    });
  });

  describe("getOptionByValue", () => {
    interface Option {
      value: string;
      label: string;
    }

    it("should find option by value", () => {
      const options: Option[] = [
        { value: "1", label: "One" },
        { value: "2", label: "Two" },
      ];
      const result = getOptionByValue(options, "1");
      expect(result).toEqual({ value: "1", label: "One" });
    });

    it("should return null if not found", () => {
      const options: Option[] = [
        { value: "1", label: "One" },
        { value: "2", label: "Two" },
      ];
      const result = getOptionByValue(options, "3");
      expect(result).toBeNull();
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should debounce function calls", () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("arg3");
    });

    it("should use default delay", () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn);

      debouncedFn();
      vi.advanceTimersByTime(250);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  currencyFormat,
  dateFormat,
  postedAgo,
  updateAt,
  extractIds,
  capitalizeFirst,
  findByKeyValue,
} from "./common";
import dayjs from "dayjs";

describe("common utilities", () => {
  describe("currencyFormat", () => {
    it("should format number with default prefix", () => {
      expect(currencyFormat(1000000)).toContain("Rp");
      expect(currencyFormat(1000000)).toContain("1.000.000");
    });

    it("should format number without prefix", () => {
      const result = currencyFormat(1000000, false);
      expect(result).not.toContain("Rp");
      expect(result).toContain("1.000.000");
    });

    it("should handle string numbers", () => {
      expect(currencyFormat("1000000")).toContain("1.000.000");
    });

    it("should return nullText for invalid values", () => {
      expect(currencyFormat(null)).toBe("-");
      expect(currencyFormat(undefined)).toBe("-");
      expect(currencyFormat("invalid")).toBe("-");
    });
  });

  describe("dateFormat", () => {
    it("should format date with default format", () => {
      const date = new Date("2024-01-15T10:30:00");
      const result = dateFormat(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format date with custom format", () => {
      const date = new Date("2024-01-15");
      const result = dateFormat(date, "YYYY-MM-DD");
      expect(result).toBe("2024-01-15");
    });

    it("should return nullText for invalid dates", () => {
      expect(dateFormat(null)).toBe("-");
      expect(dateFormat(undefined)).toBe("-");
      expect(dateFormat("invalid")).toBe("-");
    });

    it("should return nullText for invalid year", () => {
      const invalidDate = new Date("1970-01-01");
      expect(dateFormat(invalidDate)).toBe("-");
    });
  });

  describe("postedAgo", () => {
    it("should return relative time for recent dates", () => {
      const recentDate = dayjs().subtract(1, "hour").toDate();
      const result = postedAgo(recentDate);
      expect(result).toContain("Posted");
    });

    it("should return formatted date for old dates", () => {
      const oldDate = dayjs().subtract(25, "hour").toDate();
      const result = postedAgo(oldDate);
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
    });
  });

  describe("updateAt", () => {
    it("should return relative time for recent dates", () => {
      const recentDate = dayjs().subtract(1, "hour").toDate();
      const result = updateAt(recentDate);
      expect(result).toContain("Last updated");
    });
  });

  describe("extractIds", () => {
    it("should extract ids from objects", () => {
      const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
      expect(extractIds(items)).toEqual(["1", "2", "3"]);
    });

    it("should extract ids from strings", () => {
      const items = ["1", "2", "3"];
      expect(extractIds(items)).toEqual(["1", "2", "3"]);
    });

    it("should filter out undefined values", () => {
      const items = [{ id: "1" }, undefined, { id: "2" }];
      expect(extractIds(items)).toEqual(["1", "2"]);
    });

    it("should filter out items without id", () => {
      const items = [{ id: "1" }, {}, { id: "2" }];
      expect(extractIds(items)).toEqual(["1", "2"]);
    });
  });

  describe("capitalizeFirst", () => {
    it("should capitalize first letter", () => {
      expect(capitalizeFirst("hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalizeFirst("")).toBe("");
    });

    it("should handle single character", () => {
      expect(capitalizeFirst("a")).toBe("A");
    });
  });

  describe("findByKeyValue", () => {
    interface TestItem {
      id: number;
      name: string;
    }

    it("should find item by key value", () => {
      const array: TestItem[] = [
        { id: 1, name: "One" },
        { id: 2, name: "Two" },
        { id: 3, name: "Three" },
      ];
      const result = findByKeyValue(array, "id", 2);
      expect(result).toEqual({ id: 2, name: "Two" });
    });

    it("should return undefined if not found", () => {
      const array: TestItem[] = [
        { id: 1, name: "One" },
        { id: 2, name: "Two" },
      ];
      const result = findByKeyValue(array, "id", 99);
      expect(result).toBeUndefined();
    });
  });
});

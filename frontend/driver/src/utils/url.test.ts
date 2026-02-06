import { describe, it, expect } from "vitest";
import { makeUrl } from "./url";

describe("url utilities", () => {
  describe("makeUrl", () => {
    it("should return path without params", () => {
      expect(makeUrl("/api/test")).toBe("/api/test");
    });

    it("should append query params", () => {
      const result = makeUrl("/api/test", { page: 1, limit: 10 });
      expect(result).toContain("/api/test?");
      expect(result).toContain("page=1");
      expect(result).toContain("limit=10");
    });

    it("should filter out null values", () => {
      const result = makeUrl("/api/test", {
        page: 1,
        limit: null,
        search: "test",
      });
      expect(result).not.toContain("limit");
      expect(result).toContain("page=1");
      expect(result).toContain("search=test");
    });

    it("should filter out undefined values", () => {
      const params: Record<
        string,
        string | number | boolean | null | undefined
      > = {
        page: 1,
        limit: undefined,
        search: "test",
      };
      const result = makeUrl("/api/test", params);
      expect(result).not.toContain("limit");
    });

    it("should filter out empty string values", () => {
      const result = makeUrl("/api/test", {
        page: 1,
        search: "",
        filter: "active",
      });
      expect(result).not.toContain("search");
      expect(result).toContain("filter=active");
    });

    it("should encode special characters", () => {
      const result = makeUrl("/api/test", { search: "test & value" });
      expect(result).toContain("search=test%20%26%20value");
    });

    it("should handle boolean values", () => {
      const result = makeUrl("/api/test", { active: true, deleted: false });
      expect(result).toContain("active=true");
      expect(result).toContain("deleted=false");
    });

    it("should handle number values", () => {
      const result = makeUrl("/api/test", { page: 1, limit: 25 });
      expect(result).toContain("page=1");
      expect(result).toContain("limit=25");
    });
  });
});

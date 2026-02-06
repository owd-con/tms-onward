import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
      info: vi.spyOn(console, "info").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("debug", () => {
    it("should log debug message in development", () => {
      logger.debug("Test debug", { data: "test" });
      // In development mode, debug should be called
      if (import.meta.env.DEV) {
        expect(consoleSpy.debug).toHaveBeenCalled();
      }
    });
  });

  describe("info", () => {
    it("should log info message", () => {
      logger.info("Test info", { data: "test" });
      if (import.meta.env.DEV) {
        expect(consoleSpy.info).toHaveBeenCalled();
      }
    });
  });

  describe("warn", () => {
    it("should log warning message", () => {
      logger.warn("Test warning", { data: "test" });
      if (import.meta.env.DEV) {
        expect(consoleSpy.warn).toHaveBeenCalled();
      }
    });
  });

  describe("error", () => {
    it("should log error message", () => {
      logger.error("Test error", new Error("Test"));
      if (import.meta.env.DEV) {
        expect(consoleSpy.error).toHaveBeenCalled();
      }
    });
  });
});

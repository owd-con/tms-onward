/**
 * Structured logging utility for development and production
 * Supports different log levels and can be extended for error tracking services
 *
 * @module logger
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

/**
 * Logger class for structured logging
 * Automatically filters logs based on environment (dev/prod)
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isDevelopment && level === "debug") {
      return; // Skip debug logs in production
    }

    const formattedMessage = this.formatMessage(level, message);
    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case "debug":
        console.debug(formattedMessage, data || "");
        break;
      case "info":
        console.info(formattedMessage, data || "");
        break;
      case "warn":
        console.warn(formattedMessage, data || "");
        break;
      case "error":
        console.error(formattedMessage, data || "");
        // In production, you can send to error tracking service here
        // Example: if (window.Sentry) window.Sentry.captureException(data);
        break;
    }

    // Store logs for debugging (only in development)
    if (this.isDevelopment && typeof window !== "undefined") {
      const logs =
        (window as unknown as { __appLogs?: LogEntry[] }).__appLogs || [];
      logs.push(logEntry);
      if (logs.length > 100) logs.shift(); // Keep only last 100 logs
      (window as unknown as { __appLogs: LogEntry[] }).__appLogs = logs;
    }
  }

  /**
   * Log debug message (only in development)
   * @param message - Debug message
   * @param data - Optional data to log
   */
  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }

  /**
   * Log info message
   * @param message - Info message
   * @param data - Optional data to log
   */
  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }

  /**
   * Log warning message
   * @param message - Warning message
   * @param data - Optional data to log
   */
  warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }

  /**
   * Log error message
   * In production, can be extended to send to error tracking service
   * @param message - Error message
   * @param error - Error object or data
   */
  error(message: string, error?: unknown): void {
    this.log("error", message, error);
  }

  /**
   * Log API request (for RTK Query)
   */
  apiRequest(
    url: string,
    method?: string,
    params?: unknown,
    body?: unknown
  ): void {
    if (!this.isDevelopment) return;

    const styles = {
      url: "color: #fff; background: #007acc; font-weight: bold; padding:2px 6px; border-radius:3px;",
      method:
        "color: #fff; background: #2dba4e; font-weight: bold; padding:2px 6px; border-radius:3px;",
      params:
        "color: #fff; background: #b8860b; font-weight: bold; padding:2px 6px; border-radius:3px;",
      body: "color: #fff; background: #d9534f; font-weight: bold; padding:2px 6px; border-radius:3px;",
    };

    console.log(`%c[RTKQ] URL: ${url}`, styles.url);
    if (method) {
      console.log(`%c[RTKQ] Method: ${method}`, styles.method);
    }
    if (params) {
      console.log("%c[RTKQ] Params:", styles.params, params);
    }
    if (body) {
      console.log("%c[RTKQ] Payload:", styles.body, body);
    }
  }

  /**
   * Log API response (for RTK Query)
   */
  apiResponse(response: unknown): void {
    if (!this.isDevelopment) return;

    const style =
      "color: #fff; background: #5bc0de; font-weight: bold; padding:2px 6px; border-radius:3px;";
    console.log("%c[RTKQ] Response:", style, response);
  }

  /**
   * Log API headers (for RTK Query)
   */
  apiHeaders(headers: Headers): void {
    if (!this.isDevelopment) return;

    const style = "color: orange; font-weight: bold;";
    console.log(
      "%c[RTKQ] Headers:",
      style,
      Object.fromEntries(headers.entries())
    );
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };

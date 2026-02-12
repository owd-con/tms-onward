/**
 * DOM Logger utility for debugging CSS class names and DOM issues
 * Helps identify problems with Tailwind CSS class processing
 *
 * @module domLogger
 */

import { logger } from "./logger";
import { useEffect, type RefObject } from "react";

/**
 * Log all classes on an element and check for truncated class names
 * @param element - DOM element to inspect
 * @param elementName - Name/identifier for the element in logs
 */
export function logElementClasses(
  element: HTMLElement | null,
  elementName = "Element"
): void {
  if (!element) {
    logger.warn(`[DOM Logger] ${elementName}: Element is null`);
    return;
  }

  const classes = element.className;
  const classList = Array.from(element.classList);
  const computedStyles = window.getComputedStyle(element);

  logger.debug(`[DOM Logger] ${elementName} Classes:`, {
    className: classes,
    classList,
    classCount: classList.length,
    element: {
      tagName: element.tagName,
      id: element.id,
      position: {
        top: element.offsetTop,
        left: element.offsetLeft,
        width: element.offsetWidth,
        height: element.offsetHeight,
      },
    },
  });

  // Check for suspicious class names (truncated, missing characters)
  const suspiciousClasses = classList.filter((cls) => {
    // Check for patterns that might indicate truncation
    return (
      cls.includes("-.creen") || // min-h-screen truncated
      cls.includes("-.reen") || // h-screen truncated
      cls.includes("-.ull") || // w-full truncated
      cls.includes("-.lex") || // flex truncated
      cls.endsWith("-") || // Class ending with dash
      cls.startsWith("-") || // Class starting with dash (might be valid)
      cls.length < 3 // Very short classes might be truncated
    );
  });

  if (suspiciousClasses.length > 0) {
    logger.error(
      `[DOM Logger] ${elementName} - Suspicious class names detected:`,
      {
        suspiciousClasses,
        allClasses: classList,
        elementInfo: {
          tagName: element.tagName,
          id: element.id,
          className: classes,
        },
      }
    );
  }

  // Check for expected classes that are missing
  const expectedClasses = ["min-h-screen", "h-screen", "flex", "w-full"];
  const missingClasses = expectedClasses.filter(
    (expected) => !classList.includes(expected)
  );

  if (missingClasses.length > 0) {
    logger.warn(`[DOM Logger] ${elementName} - Expected classes not found:`, {
      missingClasses,
      foundClasses: classList,
    });
  }

  // Log computed styles for key properties
  logger.debug(`[DOM Logger] ${elementName} Computed Styles:`, {
    minHeight: computedStyles.minHeight,
    height: computedStyles.height,
    width: computedStyles.width,
    display: computedStyles.display,
    position: computedStyles.position,
  });
}

/**
 * Monitor class name changes on an element
 * @param element - DOM element to monitor
 * @param elementName - Name/identifier for the element
 * @returns Cleanup function to stop monitoring
 */
export function monitorClassChanges(
  element: HTMLElement | null,
  elementName = "Element"
): () => void {
  if (!element) {
    logger.warn(`[DOM Logger] Cannot monitor ${elementName}: Element is null`);
    return () => {};
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target as HTMLElement;
        const oldValue = mutation.oldValue || "";
        const newValue = target.className;

        logger.debug(`[DOM Logger] ${elementName} - Class changed:`, {
          oldValue,
          newValue,
          added: Array.from(target.classList).filter(
            (cls) => !oldValue.includes(cls)
          ),
          removed: oldValue
            .split(" ")
            .filter((cls) => cls && !target.classList.contains(cls)),
        });

        // Check for truncation after change
        logElementClasses(target, `${elementName} (after change)`);
      }
    });
  });

  observer.observe(element, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["class"],
  });

  logger.info(
    `[DOM Logger] Started monitoring ${elementName} for class changes`
  );

  return () => {
    observer.disconnect();
    logger.info(`[DOM Logger] Stopped monitoring ${elementName}`);
  };
}

/**
 * Check if Tailwind CSS is properly loaded
 */
export function checkTailwindCSS(): void {
  // Check if Tailwind utilities are available
  const testElement = document.createElement("div");
  testElement.className = "min-h-screen flex w-full";
  document.body.appendChild(testElement);

  const styles = window.getComputedStyle(testElement);

  const checks = {
    minHeight: styles.minHeight !== "0px" && styles.minHeight !== "",
    display: styles.display === "flex",
    width: styles.width !== "0px" && styles.width !== "",
  };

  logger.info("[DOM Logger] Tailwind CSS Check:", {
    checks,
    allPassed: Object.values(checks).every((v) => v),
    computedStyles: {
      minHeight: styles.minHeight,
      display: styles.display,
      width: styles.width,
    },
  });

  document.body.removeChild(testElement);

  if (!Object.values(checks).every((v) => v)) {
    logger.error("[DOM Logger] Tailwind CSS may not be properly loaded!", {
      failedChecks: Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([key]) => key),
    });
  }
}

/**
 * Log all stylesheets and their sources
 */
export function logStylesheets(): void {
  const stylesheets = Array.from(document.styleSheets);

  logger.info("[DOM Logger] Stylesheets loaded:", {
    count: stylesheets.length,
    sources: stylesheets.map((sheet, index) => {
      try {
        return {
          index,
          href: sheet.href || "inline",
          rules: sheet.cssRules?.length || 0,
          disabled: sheet.disabled,
        };
      } catch {
        return {
          index,
          href: "cross-origin",
          error: "Cannot access cross-origin stylesheet",
        };
      }
    }),
  });

  // Check for Tailwind-specific rules
  let tailwindRulesFound = 0;
  stylesheets.forEach((sheet) => {
    try {
      if (sheet.cssRules) {
        Array.from(sheet.cssRules).forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            if (
              selector.includes(".min-h-screen") ||
              selector.includes(".h-screen") ||
              selector.includes(".flex") ||
              selector.includes(".w-full")
            ) {
              tailwindRulesFound++;
            }
          }
        });
      }
    } catch {
      // Cross-origin stylesheet, skip
    }
  });

  logger.info("[DOM Logger] Tailwind utility classes found in stylesheets:", {
    count: tailwindRulesFound,
    status: tailwindRulesFound > 0 ? "OK" : "WARNING - No Tailwind rules found",
  });
}

/**
 * Comprehensive DOM debugging for a specific element
 * @param selector - CSS selector or element reference
 * @param elementName - Name for logging
 * @returns Cleanup function to stop monitoring
 */
export function debugElement(
  selector: string | HTMLElement,
  elementName = "Element"
): (() => void) | undefined {
  const element =
    typeof selector === "string"
      ? document.querySelector<HTMLElement>(selector)
      : selector;

  if (!element) {
    logger.error(`[DOM Logger] Element not found: ${elementName}`, {
      selector: typeof selector === "string" ? selector : "direct reference",
    });
    return;
  }

  logger.info(`[DOM Logger] === Debugging ${elementName} ===`);

  // Log classes
  logElementClasses(element, elementName);

  // Log stylesheets
  logStylesheets();

  // Check Tailwind
  checkTailwindCSS();

  // Start monitoring
  const cleanup = monitorClassChanges(element, elementName);

  // Return cleanup function
  return cleanup;
}

/**
 * React hook for debugging element classes
 * Use this in React components to debug class name issues
 */
/**
 * React hook for debugging element classes
 * Use this in React components to debug class name issues
 *
 * @example
 * ```tsx
 * const mainRef = useRef<HTMLElement>(null);
 * useDOMDebugger(mainRef, "Main Container");
 * return <main ref={mainRef}>...</main>;
 * ```
 */
export function useDOMDebugger(
  ref: RefObject<HTMLElement>,
  elementName: string,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    logger.info(`[DOM Logger] Setting up debugger for ${elementName}`);

    // Initial log
    logElementClasses(ref.current, elementName);

    // Monitor changes
    const cleanup = monitorClassChanges(ref.current, elementName);

    // Check Tailwind on mount
    checkTailwindCSS();
    logStylesheets();

    return cleanup;
  }, [ref, elementName, enabled]);
}

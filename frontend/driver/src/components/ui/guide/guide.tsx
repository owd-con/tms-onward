import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Button } from "../button";
import type { GuideProps } from "./types";

const placementClass = {
  top: "tooltip-top",
  bottom: "tooltip-bottom",
  left: "tooltip-left",
  right: "tooltip-right",
};

export const Guide = ({
  steps,
  current,
  onNext,
  onPrev,
  onClose,
  className,
}: GuideProps) => {
  const step = steps[current];
  const targetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(step.targetId);
    if (el) {
      targetRef.current = el;
      el.classList.add("guide-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      const tooltip = tooltipRef.current;
      const rect = el.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY;
      const offsetLeft = rect.left + window.scrollX;

      if (tooltip) {
        tooltip.style.top = `${offsetTop}px`;
        tooltip.style.left = `${offsetLeft}px`;
      }
    }

    return () => {
      targetRef.current?.classList.remove("guide-highlight");
    };
  }, [step.targetId]);

  if (!targetRef.current) return null;

  return (
    <div
      ref={tooltipRef}
      className={clsx(
        "tooltip tooltip-open z-50",
        placementClass[step.placement || "top"],
        className
      )}
      data-tip=""
      style={{ position: "absolute", transform: "translateY(-100%)" }}
    >
      <div className="bg-base-100 shadow-xl border border-base-300 rounded-box p-4 max-w-xs space-y-2">
        {step.title && <h4 className="text-lg font-semibold">{step.title}</h4>}
        <div className="text-sm text-base-content">{step.content}</div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            size="sm"
            styleType="ghost"
            onClick={onPrev}
            disabled={current === 0}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onNext}
            disabled={current === steps.length - 1}
          >
            Next
          </Button>
          <Button size="sm" styleType="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

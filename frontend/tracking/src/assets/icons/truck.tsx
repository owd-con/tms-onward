import React, { useMemo, type SVGProps } from "react";

export const IconTruck: React.FC<SVGProps<SVGSVGElement>> = ({
  className,
  ...props
}) => {
  // Deteksi gradient dari CSS variable
  const useGradient = useMemo(() => {
    if (typeof window === "undefined") return false;
    const el = document.createElement("div");
    el.className = className || "";
    document.body.appendChild(el);
    const styles = getComputedStyle(el);
    const hasVars =
      styles.getPropertyValue("--color1") &&
      styles.getPropertyValue("--color2");
    document.body.removeChild(el);
    return Boolean(hasVars);
  }, [className]);

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M9.207 16.455C9.207 17.86 8.095 19 6.724 19C5.353 19 4.241 17.86 4.241 16.454M9.207 16.455C9.207 15.05 8.095 13.909 6.724 13.909C5.353 13.909 4.241 15.049 4.241 16.454M9.207 16.455L14.793 16.454M4.241 16.454H3V6C3 5.73478 3.10536 5.48043 3.29289 5.29289C3.48043 5.10536 3.73478 5 4 5H13.793C14.0582 5 14.3126 5.10536 14.5001 5.29289C14.6876 5.48043 14.793 5.73478 14.793 6V8.182M14.793 16.454H15.414M14.793 16.454V8.182M14.793 8.182H17.054C17.3207 8.18203 17.5847 8.23539 17.8304 8.33895C18.0762 8.4425 18.2987 8.59416 18.485 8.785L21 11.364V16.454H20.379M20.379 16.454C20.379 17.86 19.268 19 17.897 19C16.526 19 15.414 17.86 15.414 16.454M20.379 16.454C20.379 15.049 19.268 13.909 17.897 13.909C16.526 13.909 15.414 15.049 15.414 16.454"
        stroke={useGradient ? "url(#paint0)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {useGradient && (
        <defs>
          <linearGradient
            id="paint0"
            x1="12"
            y1="5"
            x2="12"
            y2="19"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--color1, currentColor)" />
            <stop offset="1" stopColor="var(--color2, currentColor)" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
};

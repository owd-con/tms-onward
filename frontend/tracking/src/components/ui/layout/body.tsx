import type { ReactNode } from "react";

interface BodyProps {
  children: ReactNode;
  className?: string;
  type?: "default" | "sidebar";
}

const Body = ({ children, className, type = "default" }: BodyProps) => {
  const typeClasses = type === "sidebar" ? "flex-col" : "w-7/8 flex-row";
  return (
    <div
      className={`flex h-screen border-r border-base-200 ${typeClasses} ${
        className ?? ""
      }`}
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default Body;

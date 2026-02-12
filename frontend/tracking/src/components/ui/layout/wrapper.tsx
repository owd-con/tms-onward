import type { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
  className?: string;
  type?: "default" | "sidebar";
}

const Wrapper = ({ children, className, type = "default" }: WrapperProps) => {
  const typeClasses = type === "sidebar" ? "flex-col" : "flex-row";
  return (
    <div className={`flex h-screen ${typeClasses} ${className ?? ""}`}>
      {children}
    </div>
  );
};

export default Wrapper;

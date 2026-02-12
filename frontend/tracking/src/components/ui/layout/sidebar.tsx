import type { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

const Sidebar = ({ children, className }: SidebarProps) => {
  return (
    <div
      className={`w-1/8 flex flex-col h-screen border-r border-base-200 ${
        className ?? ""
      }`}
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default Sidebar;

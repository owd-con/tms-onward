import { type ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiClock, HiTruck, HiUser } from "react-icons/hi2";
import clsx from "clsx";

interface FooterProps {
  children?: ReactElement;
  isMenu?: boolean;
}

const Footer = ({ children, isMenu }: FooterProps) => {
  const location = useLocation();

  if (isMenu) {
    const menuItems = [
      { path: "/a/", label: "Active", icon: HiTruck },
      { path: "/a/history", label: "History", icon: HiClock },
      { path: "/a/profile", label: "Profile", icon: HiUser },
    ];

    return (
      <div className='fixed bottom-0 left-0 right-0 z-20 h-[60px] px-2 py-2 bg-white border-t border-slate-200 flex items-center justify-around safe-area-inset-bottom'>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center gap-1 flex-1 min-w-0 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-content-tertiary hover:text-content-secondary",
              )}
            >
              <Icon size={20} />
              <span className='text-[10px]'>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "px-4 py-2 bg-white border-t border-base-300",
      )}
    >
      {children}
    </div>
  );
};

export default Footer;

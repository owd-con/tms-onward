import { Button } from "@/components";
import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { FiArrowLeft } from "react-icons/fi";

interface HeaderProps {
  className?: string;
  action?: ReactNode;
  actionDisabled?: boolean;
  title?: ReactNode;
  titleClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  children?: ReactNode;
  backTo?: () => void;
  pillLabel?: string;
  pillIcon?: ReactNode;
}

const Header: FC<HeaderProps> = ({
  className,
  backTo,
  action,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
  children,
  pillLabel,
  pillIcon,
}) => {
  return (
    <div className={clsx("p-6 lg:px-8 lg:pt-8 bg-white shrink-0 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 mb-6", className)}>
      <div className="flex flex-col">
        {/* Pill */}
        {pillLabel && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f1f5f9] border border-[#e2e8f0]/60 rounded-full w-fit mb-3">
            {pillIcon && <div className="text-emerald-500 flex items-center">{pillIcon}</div>}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{pillLabel}</span>
          </div>
        )}

        {/* Title & Back Button */}
        <div className="flex items-center gap-3">
          {backTo && (
            <Button onClick={backTo} styleType="ghost" size="sm" className="mb-2">
              <FiArrowLeft size={18} />
            </Button>
          )}
          <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight leading-none mb-1", titleClassName)}>
            {title}
          </h1>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className={clsx("text-sm text-slate-500 font-medium tracking-wide mt-1", subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {action}
        </div>
      )}

      {children}
    </div>
  );
};

export default Header;

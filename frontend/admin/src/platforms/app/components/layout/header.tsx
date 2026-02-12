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
}) => {
  return (
    <div className={clsx("p-4 lg:p-6 pb-0", className)}>
      <div
        className={clsx(
          action &&
            "flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:place-items-center place-content-between"
        )}
      >
        <div className="flex gap-4 place-items-center">
          {backTo && (
            <Button onClick={backTo} styleType="ghost">
              <FiArrowLeft />
            </Button>
          )}

          <div>
            <h1
              className={clsx("text-xl font-bold leading-8 ", titleClassName)}
            >
              {title}
            </h1>
            <div
              className={clsx(
                "text-sm font-normal leading-5 text-base-content/50",
                subtitleClassName
              )}
            >
              {subtitle}
            </div>
          </div>
        </div>

        {action}
      </div>
      {children}
    </div>
  );
};

export default Header;

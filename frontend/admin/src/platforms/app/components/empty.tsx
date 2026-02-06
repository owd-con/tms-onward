import type { FC, ReactNode } from "react";

interface EmptyTabProps {
  icon?: ReactNode;
  title?: string;
  action?: ReactNode;
  show?: boolean;
}
const EmptySection: FC<EmptyTabProps> = ({
  action,
  icon,
  title,
  show = true,
}) => {
  if (!show) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full space-y-3 text-sm leading-5 text-base-content/70">
      {icon}
      {title}
      {action}
    </div>
  );
};

export default EmptySection;

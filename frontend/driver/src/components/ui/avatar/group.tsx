import clsx from "clsx";

type AvatarGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export const AvatarGroup = ({ children, className }: AvatarGroupProps) => {
  return (
    <div className={clsx("avatar-group -space-x-6", className)}>{children}</div>
  );
};

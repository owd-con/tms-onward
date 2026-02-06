import type { FC, ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
  className?: string;
}

const Wrapper: FC<WrapperProps> = ({ className, children }) => {
  return <div className={className}>{children}</div>;
};

export default Wrapper;

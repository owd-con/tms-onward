import { type ReactNode } from "react";

const Wrapper = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {children}
    </div>
  );
};

export default Wrapper;

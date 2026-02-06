import { type FC, type ReactNode } from "react";

type Props = {
  title?: string;
  icon?: ReactNode;
  children?: ReactNode;
};

const Counter: FC<Props> = ({ title, icon, children }) => {
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
      <div className="flex place-items-center gap-2">
        <div>{icon}</div>
        <div className="font-semibold text-base leading-3">{title}</div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Counter;

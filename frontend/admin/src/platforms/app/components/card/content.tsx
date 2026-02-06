import { type FC, type ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
};

const Content: FC<Props> = ({ title, subtitle, icon, children }) => {
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
      <div className="flex place-items-center place-content-between">
        <div>
          <div className="font-semibold text-lg leading-7">{title}</div>
          <div className="font-normal text-base text-base-content/60 leading-6">
            {subtitle}
          </div>
        </div>
        <div>{icon}</div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Content;

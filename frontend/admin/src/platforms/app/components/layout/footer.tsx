import clsx from "clsx";
import type { FC, ReactNode } from "react";

interface FooterProps {
    children: ReactNode;
    className?: string;
}

const Footer: FC<FooterProps> = ({ className, children }) => {
    return <div className={clsx("p-4 lg:p-6", className)}>{children}</div>;
};

export default Footer;

import React from "react";
import clsx from "clsx";
import { AccordionItem } from "./item";
import type { AccordionItemProps } from "./types";

interface AccordionProps {
  children: React.ReactNode;
  join?: boolean;
  className?: string;
}

interface AccordionComponent extends React.FC<AccordionProps> {
  Item: React.FC<AccordionItemProps>;
}

const Accordion: AccordionComponent = ({ children, join, className }) => {
  return (
    <div
      className={clsx(
        "w-full",
        join && "join join-vertical bg-base-100",
        className
      )}
    >
      {children}
    </div>
  );
};

Accordion.Item = AccordionItem;

export { Accordion };

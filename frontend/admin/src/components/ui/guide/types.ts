import type { ReactNode } from "react";

export type GuidePosition = "top" | "right" | "bottom" | "left";

export interface GuideStep {
  title?: string;
  content: ReactNode;
  targetId: string;
  placement?: GuidePosition;
}

export interface GuideProps {
  steps: GuideStep[];
  current: number;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
  className?: string;
}

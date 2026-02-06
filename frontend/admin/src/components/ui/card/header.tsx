import clsx from "clsx";
import { Badge } from "../badge";
import type { CardHeaderProps } from "./types";

export const CardHeader = ({
  title,
  badge,
  badgeVariant,
  badgeSize,
  badgeAppearance,
  className,
}: CardHeaderProps) => {
  return (
    <h2 className={clsx("card-title", className)}>
      {title}
      {badge && (
        <Badge
          variant={badgeVariant ?? "secondary"}
          size={badgeSize ?? "sm"}
          appearance={badgeAppearance ?? "default"}
        >
          {badge}
        </Badge>
      )}
    </h2>
  );
};

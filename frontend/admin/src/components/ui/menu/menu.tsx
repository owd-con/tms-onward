import clsx from "clsx";
import type { MenuProps, MenuItem } from "./types";
import { Badge } from "../badge";

export const Menu = ({
  items,
  size = "md",
  horizontal,
  className,
  activeClass,
  inactiveClass,
}: MenuProps) => {
  const sizeClass = {
    xs: "menu-xs",
    sm: "menu-sm",
    md: "menu-md",
    lg: "menu-lg",
    xl: "menu-xl",
  }[size];

  return (
    <ul
      className={clsx(
        "menu rounded-box bg-base-200",
        sizeClass,
        horizontal && "menu-horizontal lg:min-w-max",
        className
      )}
    >
      {items.map((item, i) => (
        <MenuItem
          key={i}
          item={item}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
        />
      ))}
    </ul>
  );
};

const MenuItem = ({
  item,
  activeClass = "menu-active",
  inactiveClass = "",
}: {
  item: MenuItem;
  activeClass?: string;
  inactiveClass?: string;
}) => {
  const {
    label,
    icon,
    badge,
    disabled,
    active,
    title,
    children,
    onClick,
    hidden,
  } = item;

  if (hidden) return;

  const baseClass = clsx(
    disabled && "menu-disabled",
    active ? activeClass : inactiveClass
  );
  const handleClick = () => {
    if (!disabled) onClick?.(item);
  };

  if (title && !children) {
    return (
      <li className="menu-title">
        {typeof label === "string" ? <span>{label}</span> : label}
      </li>
    );
  }

  if (title && children) {
    return (
      <li>
        <h2 className="menu-title">{label}</h2>
        <ul className="min-w-48">
          {children.map((child, i) => (
            <MenuItem
              key={i}
              item={child}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
            />
          ))}
        </ul>
      </li>
    );
  }

  if (children && children.length > 0) {
    if (item.collapsible) {
      return (
        <li>
          <details>
            <summary className={baseClass} onClick={handleClick}>
              {icon}
              {label}
              {badge &&
                (typeof item.badge === "string" ? (
                  <Badge size="xs">{badge}</Badge>
                ) : (
                  badge
                ))}
            </summary>
            <ul className="min-w-48 mt-1">
              {children.map((child, i) => (
                <MenuItem
                  key={i}
                  item={child}
                  activeClass={activeClass}
                  inactiveClass={inactiveClass}
                />
              ))}
            </ul>
          </details>
        </li>
      );
    }

    return (
      <li>
        <a className={baseClass} onClick={handleClick}>
          {icon}
          {label}
          {badge &&
            (typeof item.badge === "string" ? (
              <Badge size="xs">{badge}</Badge>
            ) : (
              badge
            ))}
        </a>
        <ul className="min-w-48">
          {children.map((child, i) => (
            <MenuItem
              key={i}
              item={child}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
            />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <a className={baseClass} onClick={handleClick}>
        {icon}
        {label}
        {badge &&
          (typeof item.badge === "string" ? (
            <Badge size="xs">{badge}</Badge>
          ) : (
            badge
          ))}
      </a>
    </li>
  );
};

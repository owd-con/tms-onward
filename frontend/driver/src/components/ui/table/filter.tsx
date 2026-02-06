import React, { type ReactNode } from "react";
import { IoFunnel } from "react-icons/io5";
import { Button } from "../button";
import { Dropdown } from "../dropdown";

interface TableFilterProps {
  children?: ReactNode;
  isActive?: boolean;
  isDirty?: boolean;
  handleClear: () => void;
  handleFilter: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TableFilter: React.FC<TableFilterProps> = ({
  children,
  isActive = false,
  isDirty = false,
  handleClear,
  handleFilter,
  open,
  onOpenChange,
}) => {
  return (
    <Dropdown
      position="end"
      trigger={
        <Button
          styleType="soft"
          variant={isActive ? "primary" : "default"}
          className={isActive ? "avatar-online" : ""}
        >
          <IoFunnel />
        </Button>
      }
      contentClassName="w-md p-4 border-t border-base-200"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-3">
        {children}

        <div className="flex gap-3 mt-4">
          <Button
            size="sm"
            styleType="soft"
            onClick={handleClear}
            className="flex-1"
            disabled={!isDirty && !isActive}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleFilter}
            disabled={!isDirty}
            className="flex-1"
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};

export default React.memo(TableFilter);

import React, { type ReactNode } from "react";
import { IoFunnel } from "react-icons/io5";
import { FiChevronDown } from "react-icons/fi";
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
      position='end'
      trigger={
        <Button
          styleType="outline"
          className={isActive 
            ? "border-blue-500 text-blue-500 bg-blue-50 shadow-sm font-medium h-9 px-3 gap-2" 
            : "border-gray-200 text-gray-700 hover:bg-gray-50 bg-white shadow-sm font-normal h-9 px-3 gap-2"
          }
        >
          <IoFunnel className={isActive ? "text-blue-500" : "text-gray-500"} />
          <span className="text-sm">Filter Options</span>
          {isActive && <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">1</div>}
          <FiChevronDown className={isActive ? "text-blue-500 ml-1" : "text-gray-400 ml-1"} />
        </Button>
      }
      contentClassName='w-[90vw] md:w-[500px] p-5 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg'
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className='flex flex-col gap-4'>
        <div className='text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3'>
          Filter Options
        </div>
        <div className='flex flex-col gap-3'>
          {children}
        </div>

        <div className='flex gap-3 mt-2 pt-4 border-t border-gray-100'>
          <Button
            size='sm'
            variant='default'
            onClick={handleClear}
            className='flex-1 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 border shadow-sm'
            disabled={!isDirty && !isActive}
          >
            Clear
          </Button>
          <Button
            variant='primary'
            size='sm'
            onClick={handleFilter}
            disabled={!isDirty}
            className='flex-1 shadow-sm font-medium'
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};

export default React.memo(TableFilter);

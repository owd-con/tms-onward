import React from "react";
import { IoCloudDownload } from "react-icons/io5";
import { Button } from "../button";
import { useSelector } from "react-redux";
import type { RootState } from "../../../services/store";
import { Input } from "../input";
import { IconSearch } from "@/assets/icons";

interface TableToolProps {
  name: string;
  onSearch?: (text: string) => void;
  children?: React.ReactNode;
  downloadable?: boolean;
  onDownload?: () => void;
}

const TableTool: React.FC<TableToolProps> = ({
  name,
  onSearch,
  children,
  downloadable = false,
  onDownload,
}) => {
  const StateSearch = useSelector(
    (state: RootState) => state?.table?.data[name]?.textSearch,
  );

  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    if (StateSearch === "") return;
    setSearchTerm(StateSearch);
  }, [StateSearch]);

  React.useEffect(() => {
    if (StateSearch === searchTerm) return;

    const delayDebounceFn = setTimeout(() => {
      onSearch?.(searchTerm);
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row w-full items-start lg:items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-t-xl border-b-0 relative z-30">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ..."
        className="border-0! shadow-none! bg-transparent! focus:outline-none! focus:ring-0! w-full lg:w-64 text-sm"
        prefix={<IconSearch className="h-6! w-6! text-gray-400!" />}
        suffix={
          searchTerm && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm("");
              }}
              variant="error"
              shape="circle"
              size="xs"
              styleType="soft"
              className="text-error hover:text-base-100 p-0"
              aria-label="Clear search"
            >
              &times;
            </Button>
          )
        }
      />

      {children && (
        <div className="flex w-full lg:w-auto flex-wrap lg:flex-nowrap gap-3 lg:pb-0 z-10">
          {children}
        </div>
      )}

      {downloadable && (
        <Button
          onClick={onDownload}
          size="sm"
          variant="accent"
          className="text-base-100 shrink-0"
          aria-label="Download table data"
        >
          <IoCloudDownload aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default TableTool;

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
    (state: RootState) => state?.table?.data[name]?.textSearch
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
    <div className="ml-auto flex place-items-center gap-3">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ..."
        className="rounded-xl!"
        prefix={<IconSearch className="h-5 w-5" />}
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
              className="text-error hover:text-base-100 p-0!"
              aria-label="Clear search"
            >
              &times;
            </Button>
          )
        }
      />

      {children && <div className="flex gap-3">{children}</div>}

      {downloadable && (
        <Button
          onClick={onDownload}
          size="sm"
          variant="accent"
          className="text-base-100"
          aria-label="Download table data"
        >
          <IoCloudDownload aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default TableTool;

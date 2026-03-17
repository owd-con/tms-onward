import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { DatePicker } from "@/components/ui";

interface ReportTableFilterProps {
  table: {
    filter: (params: any) => void;
    State: {
      loading: boolean;
      filter: any;
    };
  };
}

const CustomerReportTableFilter = ({ table }: ReportTableFilterProps) => {
  const current = table.State?.filter ?? {};

  // Store dates as Dayjs objects in local state
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(
    () => {
      const start = current.start_date as string | undefined;
      const end = current.end_date as string | undefined;
      if (start && end) {
        return [dayjs(start), dayjs(end)];
      }
      return [null, null];
    },
  );

  const handleDateChange = (
    date: Dayjs | [Dayjs | null, Dayjs | null] | null,
  ) => {
    let newRange: [Dayjs | null, Dayjs | null] = [null, null];
    if (date && typeof date !== "string" && !("format" in date)) {
      newRange = date as [Dayjs | null, Dayjs | null];
    }
    
    setDateRange(newRange);
    
    // Auto-apply if range is complete or cleared
    if ((newRange[0] && newRange[1]) || (!newRange[0] && !newRange[1])) {
      table.filter({
        start_date: newRange[0]?.format("YYYY-MM-DD") || "",
        end_date: newRange[1]?.format("YYYY-MM-DD") || "",
      });
    }
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-64">
        <DatePicker
          mode="range"
          value={dateRange}
          onChange={handleDateChange}
          placeholder="Date Range: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
        />
      </div>
    </div>
  );
};

export default CustomerReportTableFilter;

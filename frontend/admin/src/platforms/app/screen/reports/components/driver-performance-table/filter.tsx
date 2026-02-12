import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { DatePicker } from "@/components/ui";
import TableFilters from "@/components/ui/table/filter";

interface ReportTableFilterProps {
  table: {
    filter: (params: any) => void;
    State: {
      loading: boolean;
      filter: any;
    };
  };
}

const DriverPerformanceTableFilter = ({ table }: ReportTableFilterProps) => {
  const current = table.State?.filter ?? {};

  // Store dates as Dayjs objects in local state
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null]
  >(() => {
    const start = current.start_date as string | undefined;
    const end = current.end_date as string | undefined;
    if (start && end) {
      return [dayjs(start), dayjs(end)];
    }
    return [null, null];
  });

  const handleDateChange = (
    date: Dayjs | [Dayjs | null, Dayjs | null] | null,
  ) => {
    if (date && typeof date !== "string" && !("format" in date)) {
      setDateRange(date as [Dayjs | null, Dayjs | null]);
    } else {
      setDateRange([null, null]);
    }
  };

  const handleFilter = () => {
    table.filter({
      start_date: dateRange?.[0]?.format("YYYY-MM-DD") || "",
      end_date: dateRange?.[1]?.format("YYYY-MM-DD") || "",
    });
  };

  const handleClear = () => {
    setDateRange([null, null]);
    table.filter({
      start_date: "",
      end_date: "",
    });
  };

  const isDirty = !!dateRange?.[0] && !!dateRange?.[1];
  const anyActive = !!current.start_date && !!current.end_date;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <div className='flex-1'>
          <DatePicker
            mode='range'
            value={dateRange}
            onChange={handleDateChange}
            placeholder='Select date range'
            label='Date Range'
          />
        </div>
      </div>
    </TableFilters>
  );
};

export default DriverPerformanceTableFilter;

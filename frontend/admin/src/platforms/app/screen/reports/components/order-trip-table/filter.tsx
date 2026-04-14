import { useMemo, useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";

import { RemoteSelect, DatePicker } from "@/components";
import { FiChevronDown } from "react-icons/fi";
import { useCustomer } from "@/services/customer/hooks";
import { useDriver } from "@/services/driver/hooks";

// ReportTableFilter props: accept any filter shape
type ReportFilters = {
  start_date?: string;
  end_date?: string;
  customer_id?: string;
  driver_id?: string;
};

interface ReportTableFilterProps {
  table: {
    filter: (params: Partial<ReportFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<ReportFilters>;
    };
  };
}

const OrderTripTableFilter = ({ table }: ReportTableFilterProps) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter],
  );

  // Fetch customers for filter
  const { get: getCustomers, getResult } = useCustomer();

  // Fetch drivers for filter
  const { get: getDrivers, getResult: getDriverResult } = useDriver();

  useEffect(() => {
    getCustomers({ page: 1, limit: 100, status: "active" });
    getDrivers({ page: 1, limit: 100, status: "active" });
  }, []);

  // Store dates as Dayjs objects in local state
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(() => {
    const start = current.start_date as string | undefined;
    const end = current.end_date as string | undefined;
    if (start && end) {
      return [dayjs(start), dayjs(end)];
    }
    return null;
  });

  // Customer filter state
  const [customer, setCustomer] = useState<any>(null);

  // Driver filter state
  const [driver, setDriver] = useState<any>(null);

  // Sync customer state when current.customer_id changes
  useEffect(() => {
    if (current.customer_id && getResult?.data?.data) {
      const customers = getResult.data.data as any[];
      const foundCustomer = customers.find((c) => c.id === current.customer_id);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      }
    } else if (!current.customer_id) {
      setCustomer(null);
    }
  }, [current.customer_id, getResult?.data?.data]);

  // Sync driver state when current.driver_id changes
  useEffect(() => {
    if (current.driver_id && getDriverResult?.data?.data) {
      const drivers = getDriverResult.data.data as any[];
      const foundDriver = drivers.find((d) => d.id === current.driver_id);
      if (foundDriver) {
        setDriver(foundDriver);
      }
    } else if (!current.driver_id) {
      setDriver(null);
    }
  }, [current.driver_id, getDriverResult?.data?.data]);

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
        customer_id: customer?.id || "",
        driver_id: driver?.id || "",
      });
    }
  };

  const handleFilterChange = (key: string, val: any) => {
    table.filter({
      start_date:
        key === "date"
          ? val?.[0]?.format("YYYY-MM-DD") || ""
          : dateRange
            ? dateRange[0]?.format("YYYY-MM-DD")
            : "",
      end_date:
        key === "date"
          ? val?.[1]?.format("YYYY-MM-DD") || ""
          : dateRange
            ? dateRange[1]?.format("YYYY-MM-DD")
            : "",
      customer_id:
        key === "customer"
          ? val?.id
            ? String(val.id)
            : ""
          : customer?.id
            ? String(customer.id)
            : "",
      driver_id:
        key === "driver"
          ? val?.id
            ? String(val.id)
            : ""
          : driver?.id
            ? String(driver.id)
            : "",
    });
  };

  return (
    <div className='flex flex-row items-center gap-3 w-full shrink-0'>
      <div className='w-56'>
        <RemoteSelect
          placeholder='Customer: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
          suffix={<FiChevronDown className='text-gray-400 w-4 h-4' />}
          value={customer}
          onChange={(val) => {
            setCustomer(val);
            handleFilterChange("customer", val);
          }}
          onClear={() => {
            setCustomer(null);
            handleFilterChange("customer", null);
          }}
          fetchData={(page, search) =>
            getCustomers({
              page: page || 1,
              limit: 20,
              search,
              status: "active",
            })
          }
          hook={getResult as any}
          getLabel={(item: any) => (item ? `Customer: ${item.name}` : "")}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>
      <div className='w-56'>
        <RemoteSelect
          placeholder='Driver: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
          suffix={<FiChevronDown className='text-gray-400 w-4 h-4' />}
          value={driver}
          onChange={(val) => {
            setDriver(val);
            handleFilterChange("driver", val);
          }}
          onClear={() => {
            setDriver(null);
            handleFilterChange("driver", null);
          }}
          fetchData={(page, search) =>
            getDrivers({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={getDriverResult as any}
          getLabel={(item: any) => (item ? `Driver: ${item.name}` : "")}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>
      <div className='w-70'>
        <DatePicker
          mode='range'
          value={dateRange}
          onChange={handleDateChange}
          placeholder='Date Range: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
        />
      </div>
    </div>
  );
};

export default OrderTripTableFilter;

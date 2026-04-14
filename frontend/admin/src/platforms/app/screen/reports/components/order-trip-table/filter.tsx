import { useState, useEffect, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FiChevronDown } from "react-icons/fi";

import { DatePicker, RemoteSelect } from "@/components/ui";
import { useCustomer } from "@/services/customer/hooks";
import { useDriver } from "@/services/driver/hooks";

interface ReportTableFilterProps {
  table: {
    filter: (params: any) => void;
    State: {
      loading: boolean;
      filter: any;
    };
  };
}

const OrderTripTableFilter = ({ table }: ReportTableFilterProps) => {
  const current = useMemo(() => table.State?.filter ?? {}, [table.State?.filter]);

  // Hooks for fetching
  const { get: getCustomers, getResult: customerResult } = useCustomer();
  const { get: getDrivers, getResult: driverResult } = useDriver();

  // Initial load for selects
  useEffect(() => {
    getCustomers({ page: 1, limit: 100, status: "active" });
    getDrivers({ page: 1, limit: 100, status: "active" });
  }, []);

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

  const [customer, setCustomer] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);

  // Sync customer state when current.customer_id changes
  useEffect(() => {
    if (current.customer_id && customerResult?.data?.data) {
      const customers = customerResult.data.data as any[];
      const found = customers.find((c) => String(c.id) === String(current.customer_id));
      if (found) setCustomer(found);
    } else if (!current.customer_id) {
      setCustomer(null);
    }
  }, [current.customer_id, customerResult?.data?.data]);

  // Sync driver state when current.driver_id changes
  useEffect(() => {
    if (current.driver_id && driverResult?.data?.data) {
      const drivers = driverResult.data.data as any[];
      const found = drivers.find((d) => String(d.id) === String(current.driver_id));
      if (found) setDriver(found);
    } else if (!current.driver_id) {
      setDriver(null);
    }
  }, [current.driver_id, driverResult?.data?.data]);

  const applyFilters = (updates: any) => {
    const filters = {
      start_date: dateRange[0]?.format("YYYY-MM-DD") || "",
      end_date: dateRange[1]?.format("YYYY-MM-DD") || "",
      customer_id: updates.hasOwnProperty('customer_id') ? updates.customer_id : (customer?.id || ""),
      driver_id: updates.hasOwnProperty('driver_id') ? updates.driver_id : (driver?.id || ""),
      ...updates,
    };
    table.filter(filters);
  };

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
      applyFilters({
        start_date: newRange[0]?.format("YYYY-MM-DD") || "",
        end_date: newRange[1]?.format("YYYY-MM-DD") || "",
      });
    }
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-56">
        <DatePicker
          mode="range"
          value={dateRange}
          onChange={handleDateChange}
          placeholder="Date: All Time"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
        />
      </div>

      <div className="w-56">
        <RemoteSelect
          placeholder="Customer: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          value={customer}
          onChange={(val) => {
            setCustomer(val);
            applyFilters({ customer_id: val?.id || "" });
          }}
          onClear={() => {
            setCustomer(null);
            applyFilters({ customer_id: "" });
          }}
          fetchData={(page, search) =>
            getCustomers({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={customerResult as any}
          getLabel={(item: any) => item ? `Customer: ${item.name}` : ""}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>

      <div className="w-56">
        <RemoteSelect
          placeholder="Driver: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          value={driver}
          onChange={(val) => {
            setDriver(val);
            applyFilters({ driver_id: val?.id || "" });
          }}
          onClear={() => {
            setDriver(null);
            applyFilters({ driver_id: "" });
          }}
          fetchData={(page, search) =>
            getDrivers({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={driverResult as any}
          getLabel={(item: any) => item ? `Driver: ${item.name}` : ""}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>
    </div>
  );
};

export default OrderTripTableFilter;

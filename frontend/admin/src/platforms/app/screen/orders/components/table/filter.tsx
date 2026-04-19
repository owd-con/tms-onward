import { useMemo, useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";

import { RemoteSelect, DatePicker } from "@/components/ui";
import { FiChevronDown } from "react-icons/fi";
import { orderStatusOptions, orderTypeOptions } from "@/shared/options";
import { useCustomer } from "@/services/customer/hooks";

interface TableFilterProps {
  table: {
    filter: (params: any) => void;
    State: {
      loading: boolean;
      filter: any;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter],
  );

  // Fetch customers for filter
  const { get: getCustomers, getResult } = useCustomer();

  useEffect(() => {
    getCustomers({ page: 1, limit: 100, status: "active" });
  }, []);

  // Initialize state from current filter values
  // State can differ from current until user clicks "Apply Filter"
  const [status, setStatus] = useState<any>(() => {
    const value = current.status;
    return value
      ? (orderStatusOptions.find((opt) => opt.value === value) ?? null)
      : null;
  });

  const [orderType, setOrderType] = useState<any>(() => {
    const value = current.order_type;
    return value
      ? (orderTypeOptions.find((opt) => opt.value === value) ?? null)
      : null;
  });

  const [customer, setCustomer] = useState<any>(null);

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

  const applyFilters = (updates: any) => {
    const filters = {
      status: updates.hasOwnProperty("status")
        ? updates.status
        : status?.value || "",
      order_type: updates.hasOwnProperty("order_type")
        ? updates.order_type
        : orderType?.value || "",
      customer_id: updates.hasOwnProperty("customer_id")
        ? updates.customer_id
        : customer?.id || "",
      start_date: dateRange ? dateRange[0]?.format("YYYY-MM-DD") : "",
      end_date: dateRange ? dateRange[1]?.format("YYYY-MM-DD") : "",
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
    <div className='flex flex-row items-center gap-3 w-full shrink-0'>
      <div className='w-40 md:w-52'>
        <RemoteSelect
          placeholder='Status: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
          suffix={<FiChevronDown className='text-gray-400 w-4 h-4' />}
          data={orderStatusOptions}
          value={status}
          onChange={(val) => {
            setStatus(val);
            applyFilters({ status: val?.value || "" });
          }}
          onClear={() => {
            setStatus(null);
            applyFilters({ status: "" });
          }}
          getLabel={(item: any) => (item ? `Status: ${item.label}` : "")}
          renderItem={(item: any) => item?.label}
        />
      </div>
      <div className='w-40 md:w-56'>
        <RemoteSelect
          placeholder='Customer: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
          suffix={<FiChevronDown className='text-gray-400 w-4 h-4' />}
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
      <div className='w-40 md:w-52'>
        <RemoteSelect
          placeholder='Type: All'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
          suffix={<FiChevronDown className='text-gray-400 w-4 h-4' />}
          data={orderTypeOptions}
          value={orderType}
          onChange={(val) => {
            setOrderType(val);
            applyFilters({ order_type: val?.value || "" });
          }}
          onClear={() => {
            setOrderType(null);
            applyFilters({ order_type: "" });
          }}
          getLabel={(item: any) => (item ? `Type: ${item.label}` : "")}
          renderItem={(item: any) => item?.label}
        />
      </div>
      <div className='w-70'>
        <DatePicker
          mode='range'
          value={dateRange}
          onChange={handleDateChange}
          placeholder='Date: All Time'
          inputClassName='!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium'
        />
      </div>
    </div>
  );
};

export default TableFilter;

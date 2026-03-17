import { useMemo, useState, useEffect } from "react";

import { RemoteSelect } from "@/components";
import { FiChevronDown } from "react-icons/fi";
import type { SelectOptionValue } from "@/shared/types";
import { orderStatusOptions, orderTypeOptions } from "@/shared/options";
import { useCustomer } from "@/services/customer/hooks";

// TableFilter props: accept any filter shape
type OrderFilters = {
  status?: string;
  order_type?: string;
  customer_id?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<OrderFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<OrderFilters>;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Fetch customers for filter
  const { get: getCustomers, getResult } = useCustomer();

  useEffect(() => {
    getCustomers({ page: 1, limit: 100, status: "active" });
  }, []);

  // Initialize state from current filter values
  // State can differ from current until user clicks "Apply Filter"
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? orderStatusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [orderType, setOrderType] = useState<SelectOptionValue | null>(() => {
    const value = current.order_type;
    return value
      ? orderTypeOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [customer, setCustomer] = useState<any>(null);

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

  const handleFilterChange = (key: string, val: any) => {
    table.filter({
      status: key === "status" ? (val?.value ? String(val.value) : "") : (status?.value ? String(status.value) : ""),
      order_type: key === "orderType" ? (val?.value ? String(val.value) : "") : (orderType?.value ? String(orderType.value) : ""),
      customer_id: key === "customer" ? (val?.id ? String(val.id) : "") : (customer?.id ? String(customer.id) : ""),
    });
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-40 md:w-52">
        <RemoteSelect<SelectOptionValue>
          placeholder="Status: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={orderStatusOptions}
          value={status}
          onChange={(val) => {
            setStatus(val);
            handleFilterChange("status", val);
          }}
          onClear={() => {
            setStatus(null);
            handleFilterChange("status", null);
          }}
          getLabel={(item) => item ? `Status: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>
      <div className="w-40 md:w-56">
        <RemoteSelect
          placeholder="Customer: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
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
            getCustomers({ page: page || 1, limit: 20, search, status: "active" })
          }
          hook={getResult as any}
          getLabel={(item: any) => item ? `Customer: ${item.name}` : ""}
          renderItem={(item: any) => item?.name}
          getValue={(item: any) => item.id}
        />
      </div>
      <div className="w-40 md:w-52">
        <RemoteSelect<SelectOptionValue>
          placeholder="Type: All"
          inputClassName="!bg-white !border-gray-200 !h-9 !min-h-0 !py-0 !shadow-sm hover:!bg-gray-50 !text-gray-700 cursor-pointer !rounded-lg text-sm font-medium"
          suffix={<FiChevronDown className="text-gray-400 w-4 h-4" />}
          data={orderTypeOptions}
          value={orderType}
          onChange={(val) => {
            setOrderType(val);
            handleFilterChange("orderType", val);
          }}
          onClear={() => {
            setOrderType(null);
            handleFilterChange("orderType", null);
          }}
          getLabel={(item) => item ? `Type: ${item.label}` : ""}
          renderItem={(item) => item?.label}
        />
      </div>

    </div>
  );
};

export default TableFilter;

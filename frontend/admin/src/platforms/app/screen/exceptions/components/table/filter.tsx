import { useMemo, useState, useEffect } from "react";

import { FiChevronDown } from "react-icons/fi";
import { RemoteSelect } from "@/components";
// SelectOptionValue type not used
import { useCustomer } from "@/services/customer/hooks";

// TableFilter props: accept any filter shape
type ExceptionFilters = {
  customer_id?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<ExceptionFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<ExceptionFilters>;
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

  const [dateFrom, setDateFrom] = useState(current.date_from || "");
  const [dateTo, setDateTo] = useState(current.date_to || "");
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
      customer_id: key === "customer" ? (val?.id ? String(val.id) : "") : (customer?.id ? String(customer.id) : ""),
      date_from: key === "dateFrom" ? val : current.date_from,
      date_to: key === "dateTo" ? val : current.date_to,
    });
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full shrink-0">
      <div className="w-40 md:w-48">
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
          Date From
        </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              handleFilterChange("dateFrom", e.target.value);
            }}
          />
        </div>
      </div>
      <div className="w-40 md:w-48">
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1 block">
          Date To
        </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              handleFilterChange("dateTo", e.target.value);
            }}
          />
        </div>
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
    </div>
  );
};

export default TableFilter;

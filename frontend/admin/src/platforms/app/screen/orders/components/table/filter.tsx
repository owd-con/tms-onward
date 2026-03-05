import { useMemo, useState, useEffect } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
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

  const handleClear = () => {
    setStatus(null);
    setOrderType(null);
    setCustomer(null);
    table.filter({ status: "", order_type: "", customer_id: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      order_type: orderType?.value ? String(orderType.value) : "",
      customer_id: customer?.id ? String(customer.id) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const currentOrderType = current.order_type ?? "";
    const newOrderType = orderType?.value ? String(orderType.value) : "";
    const currentCustomer = current.customer_id ?? "";
    const newCustomer = customer?.id ? String(customer.id) : "";

    return newStatus !== currentStatus || newOrderType !== currentOrderType || newCustomer !== currentCustomer;
  }, [status, orderType, customer, current.status, current.order_type, current.customer_id]);

  const anyActive = !!current.status || !!current.order_type || !!current.customer_id;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RemoteSelect<SelectOptionValue>
            label="Status"
            placeholder="All Status"
            data={orderStatusOptions}
            value={status}
            onChange={setStatus}
            onClear={() => setStatus(null)}
            getLabel={(item) => item?.label ?? ""}
            renderItem={(item) => item?.label}
          />
          <RemoteSelect
            label="Customer"
            placeholder="All Customers"
            value={customer}
            onChange={setCustomer}
            onClear={() => setCustomer(null)}
            fetchData={(page, search) =>
              getCustomers({ page: page || 1, limit: 20, search, status: "active" })
            }
            hook={getResult as any}
            getLabel={(item: any) => item.name}
            getValue={(item: any) => item.id}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RemoteSelect<SelectOptionValue>
            label="Order Type"
            placeholder="All Types"
            data={orderTypeOptions}
            value={orderType}
            onChange={setOrderType}
            onClear={() => setOrderType(null)}
            getLabel={(item) => item?.label ?? ""}
            renderItem={(item) => item?.label}
          />
        </div>
      </div>
    </TableFilters>
  );
};

export default TableFilter;

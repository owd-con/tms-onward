import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";
import { orderStatusOptions, orderTypeOptions } from "@/shared/options";

// TableFilter props: accept any filter shape
type OrderFilters = {
  status?: string;
  order_type?: string;
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

  const handleClear = () => {
    setStatus(null);
    setOrderType(null);
    table.filter({ status: "", order_type: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      order_type: orderType?.value ? String(orderType.value) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const currentOrderType = current.order_type ?? "";
    const newOrderType = orderType?.value ? String(orderType.value) : "";

    return newStatus !== currentStatus || newOrderType !== currentOrderType;
  }, [status, orderType, current.status, current.order_type]);

  const anyActive = !!current.status || !!current.order_type;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
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
    </TableFilters>
  );
};

export default TableFilter;

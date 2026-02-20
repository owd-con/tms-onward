import { memo } from "react";

import type { ExpiredDriver } from "@/services/types";
import { AlertCard } from "./AlertCard";

export interface ExpiredDriversAlertProps {
  drivers: ExpiredDriver[];
  className?: string;
}

export const ExpiredDriversAlert = memo<ExpiredDriversAlertProps>(
  ({ drivers, className }) => {
    if (drivers.length === 0) return null;

    return (
      <div className={className}>
        <AlertCard
          icon='👤'
          title='Expired Driver Licenses'
          count={drivers.length}
          items={drivers.map((d) => ({
            id: d.id,
            title: d.name,
            subtitle: `License: ${d.license_type} • ${d.phone_number}`,
            highlight: `Expired: ${d.license_expiry}`,
          }))}
        />
      </div>
    );
  }
);

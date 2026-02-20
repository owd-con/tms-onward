import { memo } from "react";

import type { ExpiredVehicle } from "@/services/types";
import { AlertCard } from "./AlertCard";

export interface ExpiredVehiclesAlertProps {
  vehicles: ExpiredVehicle[];
  className?: string;
}

export const ExpiredVehiclesAlert = memo<ExpiredVehiclesAlertProps>(
  ({ vehicles, className }) => {
    if (vehicles.length === 0) return null;

    return (
      <div className={className}>
        <AlertCard
          icon="🚚"
          title="Expired Vehicles"
          count={vehicles.length}
          items={vehicles.map((v) => ({
            id: v.id,
            title: v.plate_number,
            subtitle: `${v.brand} ${v.model} (${v.year})`,
            highlight: `Expired year: ${v.expired_year}`,
          }))}
        />
      </div>
    );
  }
);

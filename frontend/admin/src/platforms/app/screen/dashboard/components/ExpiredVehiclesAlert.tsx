import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertCard from "./AlertCard";

export default function ExpiredVehiclesAlert({ vehicles }: { vehicles: any[] }) {
  const navigate = useNavigate();
  if (vehicles.length === 0) return null;

  return (
    <AlertCard
      icon={<ShieldAlert size={20} />}
      title="Expired Permits"
      description="Vehicles with expired permits requiring immediate renewal."
      color="orange"
      count={vehicles.length}
      onClick={() => navigate('/a/master-data/vehicles')}
    />
  );
}

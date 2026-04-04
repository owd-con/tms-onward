import { UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertCard from "./AlertCard";

export default function ExpiredDriversAlert({ drivers }: { drivers: any[] }) {
  const navigate = useNavigate();
  if (drivers.length === 0) return null;

  return (
    <AlertCard
      icon={<UserCheck size={20} />}
      title="License Renewals"
      description="Drivers with expired licenses pending review and updates."
      color="amber"
      count={drivers.length}
      onClick={() => navigate('/a/master-data/drivers')}
    />
  );
}

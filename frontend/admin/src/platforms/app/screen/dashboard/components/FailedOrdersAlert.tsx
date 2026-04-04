import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertCard from "./AlertCard";

export default function FailedOrdersAlert({ orders }: { orders: any[] }) {
  const navigate = useNavigate();
  if (orders.length === 0) return null;

  return (
    <AlertCard
      icon={<AlertCircle size={20} />}
      title="Order Failures"
      description="Recent orders that encountered delivery issues or system errors."
      color="rose"
      count={orders.length}
      onClick={() => navigate('/a/exceptions')}
    />
  );
}

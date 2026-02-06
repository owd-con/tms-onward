import { FiX } from "react-icons/fi";
import { Button } from "../button";

export const AlertCloseButton = ({ onClick }: { onClick?: () => void }) => (
  <Button onClick={onClick} size="xs" shape="circle" styleType="link" aria-label="Close alert">
    <FiX className="w-4 h-4 text-base-content" aria-hidden="true" />
  </Button>
);

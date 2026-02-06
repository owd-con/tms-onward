import UserFormModal from "../form/UserFormModal";
import type { User } from "@/services/types";

const UserModal = ({
  data,
  onClose,
  onReload,
}: {
  data?: User;
  onClose: () => void;
  onReload?: () => void;
}) => {
  return (
    <UserFormModal
      open
      mode={data ? "update" : "create"}
      data={data}
      onClose={onClose}
      onSuccess={onReload}
    />
  );
};

export default UserModal;

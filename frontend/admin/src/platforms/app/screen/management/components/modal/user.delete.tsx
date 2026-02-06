import { useEffect } from "react";

import type { User } from "@/services/types";
import { Button, Modal } from "@/components";
import { useUser } from "@/services/user/hooks";

const UserDelete = ({
  data,
  onClose,
  onReload,
}: {
  data?: User;
  onClose: () => void;
  onReload: () => void;
}) => {
  const { remove: removeUser, removeResult: removeUserResult } = useUser();

  const handleDelete = () => {
    if (data) {
      removeUser({ id: data?.id as string });
    }
  };

  useEffect(() => {
    if (removeUserResult?.isSuccess) {
      onClose?.();
      onReload?.();
    }
  }, [removeUserResult]);

  return (
    <Modal.Wrapper open onClose={onClose} closeOnOutsideClick={false}>
      <Modal.Header>
        <div className="font-bold! leading-7">Delete Team Member ?</div>
      </Modal.Header>
      <Modal.Body className="text-sm font-normal leading-5">
        <p>
          This action cannot be undone and will immediately revoke their access
          to the system.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="flex-1 rounded-xl"
          variant="error"
          onClick={() => handleDelete()}
          isLoading={removeUserResult?.isLoading}
        >
          Confirm
        </Button>
        <Button
          className="flex-1 rounded-xl"
          styleType="outline"
          variant="secondary"
          onClick={() => onClose?.()}
          disabled={removeUserResult?.isLoading}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default UserDelete;

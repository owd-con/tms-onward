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
    <Modal.Wrapper open onClose={onClose} closeOnOutsideClick={false} className="!max-w-md !w-11/12 mx-4">
      <Modal.Header className="mb-4">
        <div className="text-rose-600 font-bold leading-7 text-lg">Delete Team Member</div>
        <div className="text-sm text-slate-500 leading-5 font-normal">
          This action is permanent and cannot be undone. Are you sure?
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl">
          <p className="text-sm text-rose-900/60 font-medium mb-3">You are about to revoke access for:</p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1">
            <p className="font-bold text-slate-800">{data?.name}</p>
            <p className="text-sm text-slate-500 font-medium">
              {data?.username}
            </p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => onClose?.()}
            disabled={removeUserResult?.isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={() => handleDelete()}
            isLoading={removeUserResult?.isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20"
          >
            Yes, Delete Member
          </Button>
        </div>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default UserDelete;

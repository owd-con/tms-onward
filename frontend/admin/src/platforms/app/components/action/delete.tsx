import { Button, Modal } from "@/components";

interface DeleteActionProps {
  onClose?: () => void;
  onConfirm?: () => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

const Delete = ({
  onClose,
  onConfirm,
  title = "Confirm Action",
  subtitle = "Are you sure?",
  loading = false,
}: DeleteActionProps) => {
  return (
    <Modal.Wrapper open onClose={() => onClose?.()}>
      <Modal.Header>
        <span>{title}</span>
      </Modal.Header>
      <Modal.Body>
        <p>{subtitle}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="flex-1 rounded-xl"
          variant="error"
          onClick={() => onConfirm?.()}
          isLoading={loading}
        >
          Confirm
        </Button>
        <Button
          className="flex-1 rounded-xl"
          styleType="outline"
          variant="secondary"
          onClick={() => onClose?.()}
          disabled={loading}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default Delete;

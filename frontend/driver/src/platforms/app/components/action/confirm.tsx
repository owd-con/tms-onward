import { Button, Modal } from "@/components";

interface AcceptFormProps {
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

const Accept = ({
  onClose,
  onConfirm,
  title = "Confirm Action",
  subtitle,
  loading = false,
}: AcceptFormProps) => {
  return (
    <Modal.Wrapper open onClose={onClose}>
      <Modal.Header>
        <span>{title}</span>
      </Modal.Header>
      <Modal.Body>
        Are you sure?
        <p>{subtitle}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="flex-1 rounded-xl"
          variant="success"
          onClick={onConfirm}
          isLoading={loading}
        >
          Confirm
        </Button>
        <Button
          className="flex-1 rounded-xl"
          styleType="outline"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default Accept;

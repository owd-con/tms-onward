import { MessageEmpty } from "@/assets/icons";
import { Button, Modal } from "@/components";
import EmptySection from "./empty";

const SuccessBox = ({
  title,
  message,
  action,
  onClose,
}: {
  title: string;
  message?: string;
  action: string;
  onClose: () => void;
}) => (
  <>
    <Modal.Body className="text-sm font-normal leading-5">
      <EmptySection
        title=""
        action={
          <div className="text-center">
            <h1 className="text-primary font-semibold">{title}</h1>
            {message && (
              <p className="text-xs py-4 whitespace-pre-line">{message}</p>
            )}
            <Button variant="success" size="xs" onClick={onClose}>
              {action}
            </Button>
          </div>
        }
        icon={<MessageEmpty className="w-34 h-34 opacity-40" />}
      />
    </Modal.Body>
  </>
);

export default SuccessBox;
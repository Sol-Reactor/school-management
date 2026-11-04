import { useRef } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import Button from './Button';
import Modal from './Modal';

/**
 * Confirmation for destructive actions. Focus starts on "Cancel" so an
 * accidental Enter never deletes anything.
 */
const ConfirmDialog = ({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  loading = false,
  tone = 'danger',
}) => {
  const cancelRef = useRef(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      title={title}
      size="sm"
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === 'danger' && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <LuTriangleAlert aria-hidden="true" className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

// Admin-only: create a TEACHER / STUDENT / PARENT / ADMIN account via POST /api/users.
import { useId } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Input } from '../ui/Field';
import FormAlert from './FormAlert';
import { useForm, validators } from '../../hooks/useForm';
import { usersApi } from '../../services/schoolService';
import { ROLE_LABEL } from '../../config/navigation';

const CreateUserDialog = ({ isOpen, onClose, role, onCreated }) => {
  const formId = useId();
  const form = useForm({ fullName: '', email: '', password: '' }, (v) => ({
    fullName: validators.required(v.fullName, 'Full name') || (v.fullName.trim().length < 2 ? 'Enter at least 2 characters' : undefined),
    email: validators.required(v.email, 'Email') || validators.email(v.email),
    password: validators.password(v.password),
  }));

  const close = () => {
    form.reset();
    onClose();
  };

  const label = ROLE_LABEL[role].toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Add ${label}`}
      description={`Creates a ${label} account. Share the temporary password securely; they can change it after signing in.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={form.submitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={form.submitting} loadingText="Creating…">
            Create account
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const { user } = await usersApi.create({ ...values, role });
          form.reset();
          onCreated?.(user);
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <Field label="Full name" required error={form.errors.fullName}>
          <Input autoComplete="name" {...form.field('fullName')} />
        </Field>
        <Field label="Email" required error={form.errors.email}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.field('email')} />
        </Field>
        <Field label="Temporary password" required hint="At least 8 characters, with a letter and a number." error={form.errors.password}>
          <Input type="password" autoComplete="new-password" {...form.field('password')} />
        </Field>
      </form>
    </Modal>
  );
};

export default CreateUserDialog;

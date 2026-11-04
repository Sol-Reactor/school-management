import { useId } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Field';
import FormAlert from '../../components/forms/FormAlert';
import { useApi } from '../../hooks/useApi';
import { useForm, validators } from '../../hooks/useForm';
import { examsApi, subjectsApi } from '../../services/schoolService';

const CreateExamDialog = ({ classes, onClose, onCreated }) => {
  const formId = useId();
  const form = useForm({ classId: classes[0]?.id ?? '', subjectId: '', name: '', date: '' }, (v) => ({
    classId: validators.required(v.classId, 'Class'),
    subjectId: validators.required(v.subjectId, 'Subject'),
    name: validators.required(v.name, 'Exam name'),
    date: validators.required(v.date, 'Date'),
  }));
  const subjects = useApi(() => subjectsApi.list({ classId: form.values.classId }), [form.values.classId], { enabled: !!form.values.classId });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Schedule an exam"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={form.submitting}>Schedule exam</Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          const { exam } = await examsApi.create(v);
          onCreated(exam);
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Class" required error={form.errors.classId}>
            <Select
              {...form.field('classId')}
              onChange={(e) => form.setValues((s) => ({ ...s, classId: e.target.value, subjectId: '' }))}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" required error={form.errors.subjectId} hint={subjects.data?.subjects?.length === 0 ? 'This class has no subjects yet.' : undefined}>
            <Select {...form.field('subjectId')} disabled={!subjects.data?.subjects?.length}>
              <option value="">Select…</option>
              {(subjects.data?.subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Exam name" required hint="e.g. Unit test 3" error={form.errors.name}>
          <Input {...form.field('name')} />
        </Field>
        <Field label="Date" required error={form.errors.date}>
          <Input type="date" {...form.field('date')} />
        </Field>
      </form>
    </Modal>
  );
};

export default CreateExamDialog;

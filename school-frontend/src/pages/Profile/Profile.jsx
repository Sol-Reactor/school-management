import { useId } from 'react';
import { Link } from 'react-router-dom';
import { LuSave } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm, validators } from '../../hooks/useForm';
import { ROLE_LABEL } from '../../config/navigation';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import FormAlert from '../../components/forms/FormAlert';
import { formatDate } from '../../lib/format';

const isUrl = (v) => {
  if (!v) return true;
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

const Row = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4">
    <dt className="w-40 shrink-0 text-sm text-ink-subtle">{label}</dt>
    <dd className="text-sm font-medium text-ink">{children}</dd>
  </div>
);

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const formId = useId();
  const form = useForm({ fullName: user.fullName, avatar: user.avatar ?? '' }, (v) => ({
    fullName: validators.required(v.fullName, 'Name') || (v.fullName.trim().length < 2 ? 'Enter at least 2 characters' : undefined),
    avatar: isUrl(v.avatar.trim()) ? undefined : 'Enter a full https:// image link, or leave it blank',
  }));
  const dirty = form.values.fullName !== user.fullName || form.values.avatar !== (user.avatar ?? '');

  return (
    <>
      <PageHeader title="Your profile" description="How you appear to others in Haya." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal details" />
          <CardBody>
            <form
              id={formId}
              noValidate
              className="space-y-5"
              onSubmit={form.handleSubmit(async (v) => {
                await updateProfile({ fullName: v.fullName.trim(), avatar: v.avatar.trim() || null });
                showToast('Profile updated.');
              })}
            >
              <FormAlert>{form.formError}</FormAlert>
              <div className="flex items-center gap-4">
                <Avatar name={form.values.fullName || user.fullName} src={isUrl(form.values.avatar) ? form.values.avatar : undefined} size="lg" decorative />
                <p className="text-sm text-ink-muted">Your initials are shown unless you add a photo link below.</p>
              </div>
              <Field label="Full name" required error={form.errors.fullName}>
                <Input autoComplete="name" {...form.field('fullName')} disabled={user.isDemo} />
              </Field>
              <Field label="Photo URL" optional hint="A link to a square image (https://…)." error={form.errors.avatar}>
                <Input type="url" inputMode="url" placeholder="https://" {...form.field('avatar')} disabled={user.isDemo} />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" icon={LuSave} loading={form.submitting} disabled={!dirty || user.isDemo}>
                  Save changes
                </Button>
                {user.isDemo && <span className="text-sm text-ink-subtle">Editing is disabled in the demo.</span>}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardBody className="py-2">
            <dl className="divide-y divide-line">
              <Row label="Email">{user.email}</Row>
              <Row label="Role">
                <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
              </Row>
              <Row label="Member since">{formatDate(user.createdAt)}</Row>
            </dl>
          </CardBody>
        </Card>
      </div>

      {user.role === 'STUDENT' && user.student && (
        <Card className="mt-6">
          <CardHeader title="School" />
          <CardBody className="py-2">
            <dl className="divide-y divide-line">
              <Row label="Class">{user.student.class ? `${user.student.class.name} · ${user.student.class.level}` : 'Not assigned yet'}</Row>
              <Row label="Class teacher">{user.student.class?.teacher?.user.fullName ?? '—'}</Row>
              <Row label="Parent / guardian">{user.student.parent?.user.fullName ?? 'Not linked'}</Row>
            </dl>
          </CardBody>
        </Card>
      )}

      {user.role === 'TEACHER' && user.teacher && (
        <Card className="mt-6">
          <CardHeader title="Classes you lead" />
          <CardBody>
            {user.teacher.classes.length ? (
              <ul className="flex flex-wrap gap-2">
                {user.teacher.classes.map((c) => (
                  <li key={c.id}>
                    <Badge tone="primary">{c.name} · {c.students.length} students</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-subtle">You're not the class teacher of any class yet.</p>
            )}
          </CardBody>
        </Card>
      )}

      {user.role === 'PARENT' && user.parent && (
        <Card className="mt-6">
          <CardHeader title="Your children" />
          {user.parent.students.length ? (
            <ul className="divide-y divide-line">
              {user.parent.students.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={c.user.fullName} size="sm" decorative />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{c.user.fullName}</p>
                    <p className="text-xs text-ink-subtle">{c.class?.name ?? 'No class yet'}</p>
                  </div>
                  <Link to={`/students/${c.id}`} className="rounded text-sm font-semibold text-primary-ink hover:underline">
                    View progress<span className="sr-only"> for {c.user.fullName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <CardBody>
              <p className="text-sm text-ink-subtle">No children linked yet. When your child registers, they can enter your email to link accounts.</p>
            </CardBody>
          )}
        </Card>
      )}
    </>
  );
};

export default Profile;

import { Link, useNavigate } from 'react-router-dom';
import { LuGraduationCap, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm, validators } from '../../hooks/useForm';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import FormAlert from '../../components/forms/FormAlert';
import { cn } from '../../lib/cn';
import AuthLayout from './AuthLayout';

// Teachers and admins are created by a school administrator, never via public sign-up.
const ROLES = [
  { value: 'STUDENT', label: 'Student', hint: 'See your grades, attendance and timetable', icon: LuGraduationCap },
  { value: 'PARENT', label: 'Parent', hint: "Follow your children's progress", icon: LuUsers },
];

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const form = useForm(
    { role: 'STUDENT', fullName: '', email: '', password: '', confirmPassword: '', parentEmail: '' },
    (v) => ({
      fullName: validators.required(v.fullName, 'Full name') || (v.fullName.trim().length < 2 ? 'Enter at least 2 characters' : undefined),
      email: validators.required(v.email, 'Email') || validators.email(v.email),
      password: validators.password(v.password),
      confirmPassword: v.confirmPassword !== v.password ? "Passwords don't match" : undefined,
      parentEmail: v.role === 'STUDENT' ? validators.email(v.parentEmail) : undefined,
    })
  );
  const isStudent = form.values.role === 'STUDENT';

  return (
    <AuthLayout
      title="Create your account"
      subtitle="For students and parents. Teachers: your school administrator will set up your account."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="rounded font-semibold text-primary-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          const user = await register({
            role: v.role,
            fullName: v.fullName.trim(),
            email: v.email.trim(),
            password: v.password,
            ...(v.role === 'STUDENT' && v.parentEmail.trim() && { parentEmail: v.parentEmail.trim() }),
          });
          showToast(`Welcome to Haya, ${user.fullName.split(' ')[0]}!`);
          navigate('/dashboard', { replace: true });
        })}
      >
        <FormAlert>{form.formError}</FormAlert>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">I am a…</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => {
              const active = form.values.role === r.value;
              return (
                <label
                  key={r.value}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors duration-fast has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40',
                    active ? 'border-primary bg-primary-soft' : 'border-line hover:border-line-input'
                  )}
                >
                  <input type="radio" name="role" value={r.value} checked={active} onChange={form.field('role').onChange} className="sr-only" />
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <r.icon aria-hidden="true" className={cn('h-4 w-4', active ? 'text-primary-ink' : 'text-ink-subtle')} />
                    {r.label}
                  </span>
                  <span className="text-xs text-ink-muted">{r.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Full name" required error={form.errors.fullName}>
          <Input autoComplete="name" {...form.field('fullName')} />
        </Field>
        <Field label="Email" required error={form.errors.email}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.field('email')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Password" required hint="8+ characters, a letter and a number" error={form.errors.password}>
            <Input type="password" autoComplete="new-password" {...form.field('password')} />
          </Field>
          <Field label="Confirm password" required error={form.errors.confirmPassword}>
            <Input type="password" autoComplete="new-password" {...form.field('confirmPassword')} />
          </Field>
        </div>
        {isStudent && (
          <Field label="Parent's email" optional hint="Links your account to a parent who has already registered." error={form.errors.parentEmail}>
            <Input type="email" inputMode="email" {...form.field('parentEmail')} />
          </Field>
        )}
        <Button type="submit" size="lg" className="w-full" loading={form.submitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;

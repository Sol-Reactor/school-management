import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LuLock, LuMail } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm, validators } from '../../hooks/useForm';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import FormAlert from '../../components/forms/FormAlert';
import DemoPicker from '../../components/demo/DemoPicker';
import AuthLayout from './AuthLayout';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ email: '', password: '' }, (v) => ({
    email: validators.required(v.email, 'Email') || validators.email(v.email),
    password: validators.required(v.password, 'Password'),
  }));

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your school workspace."
      footer={
        <>
          New to Haya?{' '}
          <Link to="/register" className="rounded font-semibold text-primary-ink hover:underline">
            Create a student or parent account
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          const user = await login(v);
          showToast(`Welcome back, ${user.fullName.split(' ')[0]}.`);
          navigate(location.state?.from || '/dashboard', { replace: true });
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <Field label="Email" error={form.errors.email}>
          <Input type="email" icon={LuMail} autoComplete="email" inputMode="email" {...form.field('email')} />
        </Field>
        <Field label="Password" error={form.errors.password}>
          <Input type="password" icon={LuLock} autoComplete="current-password" {...form.field('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={form.submitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        or explore the demo
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <DemoPicker variant="list" />
      <p className="text-xs text-ink-subtle">Demo accounts are read-only sample data — nothing you click can break anything.</p>
    </AuthLayout>
  );
};

export default Login;

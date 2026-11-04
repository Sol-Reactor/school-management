import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight,
  LuBell,
  LuCalendarCheck,
  LuCalendarClock,
  LuPresentation,
  LuChartColumn,
  LuGraduationCap,
  LuLockKeyhole,
  LuShieldCheck,
  LuSparkles,
  LuUsers,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/brand/Logo';
import HeroIllustration from '../../components/brand/HeroIllustration';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/layout/ThemeToggle';
import DemoPicker from '../../components/demo/DemoPicker';
import { useTheme } from '../../context/ThemeContext';

const ROLES = [
  {
    icon: LuShieldCheck,
    role: 'Administrators',
    lead: 'See the whole school in one place.',
    steps: ['Create teacher accounts and classes', 'Watch attendance trends across every class', 'Spot students who need support before it shows on a report card'],
  },
  {
    icon: LuPresentation,
    role: 'Teachers',
    lead: 'Spend less time on admin.',
    steps: ["Take a class's register in seconds, on your phone", 'Enter marks in a gradebook with live class averages', 'Draft report-card comments with AI, then edit them yourself'],
  },
  {
    icon: LuGraduationCap,
    role: 'Students',
    lead: 'Know where you stand.',
    steps: ["Today's lessons and upcoming exams on one screen", 'Grades by subject, with your strongest areas', 'Attendance history you can actually read'],
  },
  {
    icon: LuUsers,
    role: 'Parents',
    lead: 'Follow every child, calmly.',
    steps: ['One dashboard for all your children', 'Weekly attendance and the latest marks', 'Plain-language progress summaries'],
  },
];

const FEATURES = [
  { icon: LuCalendarCheck, title: 'Registers that take seconds', body: 'Keyboard-friendly, works on a phone, and remembers what you have already saved. Past registers can be corrected safely.' },
  { icon: LuChartColumn, title: 'Gradebooks with context', body: "Enter marks with validation and see the class average, highest and lowest as you go. Students see their bands at once." },
  { icon: LuCalendarClock, title: 'Clash-free timetables', body: 'Haya refuses lessons that double-book a class or a teacher, and tells you exactly which lesson is in the way.' },
  { icon: LuSparkles, title: 'Haya Insights', body: 'AI-written progress summaries and at-risk explanations, built on numbers Haya computes itself. Always labelled, always reviewed by a person.' },
  { icon: LuLockKeyhole, title: 'Private by default', body: 'Parents see only their children and teachers see only their classes. These rules are enforced on the server for every request.' },
  { icon: LuBell, title: 'Gentle notifications', body: 'Enrolments, new grades and attendance alerts arrive in one quiet inbox, without the email noise.' },
];

const Section = ({ id, eyebrow, title, intro, children, className = '' }) => (
  <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 py-20 sm:py-24 ${className}`}>
    <div className="container-page">
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>}
        <h2 id={`${id}-title`} className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-4 text-lg text-ink-muted">{intro}</p>}
      </div>
      <div className="mt-12">{children}</div>
    </div>
  </section>
);

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.title = 'Haya — School management for admins, teachers, students and parents';
  }, []);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className="sticky top-0 z-sticky border-b border-line/70 bg-canvas/85 backdrop-blur">
        <nav aria-label="Primary" className="container-page flex h-16 items-center gap-6">
          <Link to="/" className="rounded-md" aria-label="Haya home">
            <Logo />
          </Link>
          <ul className="hidden items-center gap-6 text-sm font-medium text-ink-muted md:flex">
            <li><a href="#how" className="rounded hover:text-ink">How it works</a></li>
            <li><a href="#features" className="rounded hover:text-ink">Features</a></li>
            <li><a href="#demo" className="rounded hover:text-ink">Live demo</a></li>
          </ul>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button to="/dashboard" size="sm">Open dashboard</Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
                <Button href="#demo" size="sm">Try the demo</Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(var(--primary)/0.14),transparent)]" />
          <div className="container-page relative grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-muted">
                <LuSparkles aria-hidden="true" className="h-3.5 w-3.5 text-primary-ink" />
                Now with AI progress summaries
              </p>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                The calm way to <span className="text-primary-ink">run a school.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-muted">
                Haya puts attendance, grades and timetables in one workspace, with a focused view for every administrator, teacher, student and parent. Teachers spend less time on admin and families stay informed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="#demo" size="lg" iconRight={LuArrowRight}>Try the live demo</Button>
                <Button to="/register" variant="secondary" size="lg">Create an account</Button>
              </div>
              <p className="mt-4 text-sm text-ink-subtle">No sign-up needed for the demo. It's a read-only sample school.</p>
            </div>
            <HeroIllustration className="mx-auto w-full max-w-lg" />
          </div>
        </section>

        {/* How it works */}
        <Section id="how" eyebrow="How it works" title="One school, four perspectives" intro="Everyone signs in to the same Haya and sees only what's relevant to them.">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ icon: Icon, role, lead, steps }) => (
              <li key={role} className="card flex flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{role}</h3>
                <p className="mt-1 text-sm font-medium text-ink-muted">{lead}</p>
                <ol className="mt-5 space-y-3">
                  {steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm text-ink-muted">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-ink">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </Section>

        {/* Product screenshot */}
        <section aria-labelledby="product-title" className="border-y border-line bg-surface-muted/40 py-20 sm:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="product-title" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Information that's easy to act on
              </h2>
              <p className="mt-4 text-lg text-ink-muted">
                Every dashboard leads with the few numbers that matter, then the trend behind them, then what's coming up next.
              </p>
            </div>
            <figure className="mx-auto mt-12 max-w-5xl">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
                <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-line bg-surface-muted/60 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                </div>
                <img
                  src={resolvedTheme === 'dark' ? '/screenshots/admin-dashboard-dark.png' : '/screenshots/admin-dashboard-light.png'}
                  alt="Haya admin dashboard: KPI cards for students, classes, attendance and average grade above a weekly attendance chart, a recent activity feed and a classes table."
                  width="1440"
                  height="900"
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </div>
              <figcaption className="mt-4 text-center text-sm text-ink-subtle">The administrator dashboard, showing the demo school.</figcaption>
            </figure>
          </div>
        </section>

        {/* Features */}
        <Section id="features" eyebrow="Features" title="Everything a school day needs, nothing it doesn't">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card p-6">
                <Icon aria-hidden="true" className="h-6 w-6 text-primary-ink" />
                <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Demo */}
        <Section
          id="demo"
          eyebrow="Live demo"
          title="Explore Haya as any role"
          intro="Sign in to a sample school with 30 students, 8 weeks of attendance and real gradebooks. It's read-only, so click anything."
          className="bg-surface-muted/40"
        >
          <div className="mx-auto max-w-2xl">
            <DemoPicker />
          </div>
        </Section>

        {/* Final CTA */}
        <section className="py-20 sm:py-24">
          <div className="container-page">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight text-primary-on sm:text-4xl">Ready to give your school a calmer week?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-on">
                Students and parents can create an account in a minute. Teacher accounts are set up by your school administrator.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-surface px-6 font-semibold text-ink shadow-sm transition-colors duration-fast hover:bg-surface-muted"
                >
                  Create an account
                </Link>
                <a
                  href="#demo"
                  className="inline-flex h-12 items-center justify-center rounded-lg px-6 font-semibold text-primary-on ring-1 ring-inset ring-primary-on/50 transition-colors duration-fast hover:bg-primary-on/10"
                >
                  Try the demo first
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-ink-subtle sm:flex-row">
          <Logo textClassName="text-base" />
          <p>Built with React, Express, PostgreSQL and the Claude API.</p>
          <div className="flex gap-4">
            <Link to="/login" className="rounded hover:text-ink">Sign in</Link>
            <Link to="/register" className="rounded hover:text-ink">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

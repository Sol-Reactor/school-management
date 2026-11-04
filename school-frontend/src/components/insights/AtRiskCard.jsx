// Dashboard card: students flagged by rule-based checks, with an optional
// AI explanation of each flag. The AI never decides who is flagged.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuChevronDown, LuInfo, LuShieldCheck, LuSparkles, LuTrendingDown } from 'react-icons/lu';
import { useApi } from '../../hooks/useApi';
import { insightsApi } from '../../services/insightsService';
import { getErrorMessage } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import AiLabel from './AiLabel';

const FlaggedStudent = ({ s, aiAvailable }) => {
  const [explanation, setExplanation] = useState(s.explanation);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelId = `risk-${s.studentId}`;

  const explain = async () => {
    setOpen(true);
    if (explanation) return;
    setLoading(true);
    setError(null);
    try {
      const { explanation: e } = await insightsApi.explainRisk(s.studentId);
      setExplanation(e);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not explain this flag right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={s.fullName} size="sm" decorative />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/students/${s.studentId}`} className="rounded font-semibold text-ink hover:text-primary-ink hover:underline">
              {s.fullName}
            </Link>
            {s.className && <span className="text-xs text-ink-subtle">{s.className}</span>}
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Flags">
            {s.flags.map((f) => (
              <li key={f.code}>
                <Badge tone={s.severity === 'high' ? 'danger' : 'warning'} icon={LuTrendingDown}>{f.label}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-ink-muted">{s.flags.map((f) => f.detail).join(' · ')}</p>
        </div>
        {aiAvailable && (
          <Button
            variant="soft"
            size="sm"
            icon={open ? LuChevronDown : LuSparkles}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => (open ? setOpen(false) : explain())}
          >
            {open ? 'Hide' : 'Explain'}<span className="sr-only"> flags for {s.fullName}</span>
          </Button>
        )}
      </div>
      {open && (
        <div id={panelId} className="mt-3 rounded-lg bg-surface-muted/60 p-3" aria-live="polite">
          {loading ? (
            <div className="space-y-2" role="status" aria-label="Writing explanation">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : error ? (
            <p role="alert" className="text-sm text-danger">{error}</p>
          ) : explanation ? (
            <div className="space-y-2">
              <AiLabel canned={explanation.canned} />
              <p className="text-sm text-ink">{explanation.content}</p>
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
};

const AtRiskCard = () => {
  const { data, loading, error, refetch } = useApi(() => insightsApi.atRisk(), []);
  const students = data?.students ?? [];
  const r = data?.rules;

  return (
    <Card aria-labelledby="at-risk-title">
      <CardHeader
        id="at-risk-title"
        title="Students who may need support"
        description="Flagged by attendance and marks rules, not by AI. Use “Explain” for a plain-language summary."
        actions={data && <Badge tone={students.length ? 'warning' : 'success'}>{students.length} flagged</Badge>}
      />
      {loading && !data ? (
        <div className="space-y-3 p-5" role="status" aria-label="Checking students">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <EmptyState compact title="Couldn't run the checks" description={error} action={<Button variant="secondary" size="sm" onClick={refetch}>Try again</Button>} />
      ) : students.length === 0 ? (
        <EmptyState compact icon={LuShieldCheck} title="No one is flagged right now" description="Attendance and recent marks look healthy across your students." />
      ) : (
        <ul className="divide-y divide-line">
          {students.slice(0, 6).map((s) => (
            <FlaggedStudent key={s.studentId} s={s} aiAvailable={data.aiAvailable} />
          ))}
        </ul>
      )}
      {r && (
        <details className="group border-t border-line px-5 py-3 text-xs text-ink-subtle">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-ink-muted hover:text-ink">
            <LuInfo aria-hidden="true" className="h-3.5 w-3.5" />
            How students are flagged
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Attendance below {r.lowAttendance}% in the last {r.recentDays} days</li>
            <li>Attendance down {r.attendanceDrop}+ points against the previous five weeks</li>
            <li>Recent exam average down {r.gradeDrop}+ points against earlier exams</li>
            <li>Recent exam average below {r.lowGrades}%</li>
          </ul>
        </details>
      )}
    </Card>
  );
};

export default AtRiskCard;

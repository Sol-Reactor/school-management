// "Haya Insights" on a student's profile: AI progress summary with 2–3 suggestions.
import { useEffect, useId, useRef, useState } from 'react';
import { LuCheck, LuCopy, LuRefreshCw, LuSparkles, LuSquare } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { insightsApi } from '../../services/insightsService';
import { Card, CardBody, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { relativeTime } from '../../lib/format';
import AiLabel from './AiLabel';

const FRIENDLY = {
  AI_NOT_CONFIGURED: 'AI summaries are not switched on for this school yet.',
  INSUFFICIENT_DATA: null, // server message is already friendly
  AI_BUSY: 'The AI service is busy. Please try again in a minute.',
  AI_UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again shortly.',
};

/** Renders the summary: paragraph(s) then the "Suggestions:" bullet list. */
const SummaryText = ({ text, streaming }) => {
  const [body, suggestions] = text.split(/\n\s*Suggestions:\s*\n?/i);
  const bullets = (suggestions ?? '').split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ink">
      {body
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      {bullets.length > 0 && (
        <>
          <p className="font-semibold">Suggestions</p>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-primary-ink">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </>
      )}
      {streaming && <span aria-hidden="true" className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary align-middle motion-reduce:animate-none" />}
    </div>
  );
};

const ProgressSummaryCard = ({ studentId, firstName, className = 'mt-6' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const existing = useApi(() => insightsApi.getSummary(studentId), [studentId]);
  const [insight, setInsight] = useState(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | error
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const titleId = useId();

  useEffect(() => () => abortRef.current?.abort(), []);

  const shown = insight ?? existing.data?.insight;
  const canCopyAsComment = user.role === 'TEACHER' || user.role === 'ADMIN';

  const generate = async (regenerate) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('streaming');
    setError(null);
    setDraft('');
    try {
      const { insight: result, cached } = await insightsApi.generateSummary(studentId, {
        regenerate,
        signal: controller.signal,
        onDelta: (t) => setDraft((d) => d + t),
      });
      setInsight({ ...result, stale: false });
      setStatus('idle');
      if (cached) showToast('Showing the saved summary. Nothing has changed since it was written.', 'info');
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setError(FRIENDLY[err.code] ?? err.message);
    }
  };

  const copy = async () => {
    const text = shown?.content.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast(canCopyAsComment ? 'Copied as a draft report-card comment. Review it before sharing.' : 'Summary copied.');
    } catch {
      showToast("Couldn't copy to the clipboard. Select the text instead.", 'error');
    }
  };

  const streaming = status === 'streaming';
  const aiAvailable = existing.data?.aiAvailable ?? true;

  return (
    <Card className={`overflow-hidden ${className}`} aria-labelledby={titleId} aria-busy={streaming}>
      <CardHeader
        id={titleId}
        title={
          <span className="inline-flex items-center gap-2">
            <LuSparkles aria-hidden="true" className="h-4 w-4 text-primary-ink" />
            Haya Insights · progress summary
          </span>
        }
        description={`A short, constructive summary of ${firstName}'s attendance and results, with next steps.`}
        actions={
          shown && !streaming ? (
            <>
              <Button variant="secondary" size="sm" icon={copied ? LuCheck : LuCopy} onClick={copy}>
                {canCopyAsComment ? 'Copy as report comment' : 'Copy'}
              </Button>
              <Button variant="ghost" size="sm" icon={LuRefreshCw} onClick={() => generate(true)} disabled={!aiAvailable}>
                Regenerate
              </Button>
            </>
          ) : streaming ? (
            <Button variant="ghost" size="sm" icon={LuSquare} onClick={() => abortRef.current?.abort()}>
              Stop
            </Button>
          ) : null
        }
      />
      <CardBody>
        {existing.loading && !existing.data ? (
          <div className="space-y-2" role="status" aria-label="Loading summary">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : streaming ? (
          <div aria-live="polite">
            <p className="mb-3 text-xs font-medium text-ink-subtle">Writing summary from {firstName}'s latest data…</p>
            {draft ? (
              <SummaryText text={draft} streaming />
            ) : (
              <div className="space-y-2" aria-hidden="true">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            )}
          </div>
        ) : shown ? (
          <div className="space-y-4">
            <AiLabel canned={shown.canned} />
            {shown.stale && (
              <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info">
                New grades or attendance were recorded since this summary was written. Regenerate for an up-to-date version.
              </p>
            )}
            <SummaryText text={shown.content} />
            <p className="text-xs text-ink-subtle">
              Written {relativeTime(shown.createdAt)}
              {!shown.canned && ` · ${shown.model}`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-sm text-ink-muted">
              {aiAvailable
                ? `Generate a plain-language summary of ${firstName}'s progress. It's built only from grades and attendance, and you should review it before sharing.`
                : 'AI summaries are not switched on for this school yet.'}
            </p>
            <Button icon={LuSparkles} onClick={() => generate(false)} disabled={!aiAvailable}>
              Generate summary
            </Button>
          </div>
        )}
        {status === 'error' && error && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            <span className="flex-1">{error}</span>
            <Button variant="secondary" size="sm" onClick={() => generate(!!shown)}>Try again</Button>
          </div>
        )}
        {user.isDemo && !streaming && (
          <p className="mt-4 text-xs text-ink-subtle">Demo accounts get a sample built from the same numbers, so no AI credits are used.</p>
        )}
      </CardBody>
    </Card>
  );
};

export default ProgressSummaryCard;

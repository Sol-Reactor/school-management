// Parent dashboard: one AI progress summary, with a switcher when there are several children.
import { useState } from 'react';
import ProgressSummaryCard from '../../components/insights/ProgressSummaryCard';
import { cn } from '../../lib/cn';
import { firstName } from './helpers';

const ChildInsights = ({ students }) => {
  const [selected, setSelected] = useState(students[0]?.id);
  const child = students.find((c) => c.id === selected) ?? students[0];
  if (!child) return null;

  return (
    <div className="mt-6">
      {students.length > 1 && (
        <div role="group" aria-label="Show the summary for" className="mb-3 inline-flex rounded-xl border border-line bg-surface p-1">
          {students.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === child.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                'min-h-9 rounded-lg px-3 text-sm font-medium transition-colors duration-fast',
                c.id === child.id ? 'bg-primary-soft text-primary-ink' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              )}
            >
              {firstName(c.user.fullName)}
            </button>
          ))}
        </div>
      )}
      <ProgressSummaryCard key={child.id} studentId={child.id} firstName={firstName(child.user.fullName)} className="" />
    </div>
  );
};

export default ChildInsights;

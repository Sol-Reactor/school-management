import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuEye } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { ROLE_LABEL } from '../../config/navigation';
import { cn } from '../../lib/cn';

const ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

/** Shown to demo sessions: explains read-only mode and lets visitors hop between roles. */
const DemoBanner = () => {
  const { user, demoLogin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(null);

  if (!user?.isDemo) return null;

  const switchTo = async (role) => {
    if (role === user.role) return;
    setSwitching(role);
    try {
      await demoLogin(role);
      navigate('/dashboard');
      showToast(`Now viewing Haya as a ${ROLE_LABEL[role].toLowerCase()}.`, 'info');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="border-b border-accent/25 bg-accent-soft">
      <div className="flex flex-col gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="flex items-center gap-2 text-ink">
          <LuEye aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
          <span>
            <strong className="font-semibold">Demo mode</strong> — read-only sample school. Changes are disabled.
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="View the demo as">
          <span className="text-ink-muted">View as:</span>
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => switchTo(role)}
              aria-pressed={role === user.role}
              disabled={!!switching}
              className={cn(
                'h-8 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors duration-fast disabled:cursor-wait',
                role === user.role ? 'bg-ink text-ink-inverse' : 'bg-surface text-ink ring-1 ring-line hover:ring-line-input'
              )}
            >
              {switching === role ? 'Switching…' : ROLE_LABEL[role]}
            </button>
          ))}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="ml-1 h-8 cursor-pointer rounded-full px-3 text-xs font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Exit demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;

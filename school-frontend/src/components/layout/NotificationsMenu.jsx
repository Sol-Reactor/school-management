import { LuBell, LuBellOff, LuCheckCheck } from 'react-icons/lu';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Menu } from '../ui/Menu';
import EmptyState from '../ui/EmptyState';

const NotificationsMenu = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const { showToast } = useToast();

  const run = async (fn) => {
    try {
      await fn();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  return (
    <Menu
      role="dialog"
      label="Notifications"
      className="w-[min(24rem,calc(100vw-2rem))]"
      buttonLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      buttonClassName="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-surface-muted hover:text-ink"
      buttonContent={
        <>
          <LuBell aria-hidden="true" className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface dark:text-canvas"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Notifications</h2>
        {unreadCount > 0 && !user?.isDemo && (
          <button
            type="button"
            onClick={() => run(markAllAsRead)}
            className="inline-flex cursor-pointer items-center gap-1 rounded text-xs font-semibold text-primary-ink hover:underline"
          >
            <LuCheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState compact icon={LuBellOff} title="You're all caught up" description="New activity for your account will appear here." />
      ) : (
        <ul className="max-h-96 divide-y divide-line overflow-y-auto">
          {notifications.slice(0, 20).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                disabled={n.read || user?.isDemo}
                onClick={() => run(() => markAsRead(n.id))}
                className={cn(
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors duration-fast enabled:cursor-pointer enabled:hover:bg-surface-muted',
                  !n.read && 'bg-primary-soft/50'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{n.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{n.message}</span>
                  <span className="mt-1 block text-xs text-ink-subtle">
                    {relativeTime(n.createdAt)}
                    {!n.read && <span className="sr-only"> · unread, select to mark as read</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Menu>
  );
};

export default NotificationsMenu;

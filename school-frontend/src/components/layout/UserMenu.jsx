import { useNavigate } from 'react-router-dom';
import { LuChevronDown, LuLogOut, LuSettings, LuUserRound } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABEL } from '../../config/navigation';
import Avatar from '../ui/Avatar';
import { Menu, MenuItem } from '../ui/Menu';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    showToast('You have been signed out.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <Menu
      label="Account"
      className="w-64"
      buttonClassName="flex h-10 cursor-pointer items-center gap-2 rounded-lg pl-1 pr-2 transition-colors duration-fast hover:bg-surface-muted"
      buttonContent={
        <>
          <Avatar name={user?.fullName} src={user?.avatar} size="sm" decorative />
          {/* The visible name is the accessible name (WCAG 2.5.3); on phones it is visually hidden. */}
          <span className="sr-only text-sm font-semibold text-ink md:not-sr-only md:max-w-32 md:truncate">{user?.fullName}</span>
          <LuChevronDown aria-hidden="true" className="hidden h-4 w-4 text-ink-subtle md:block" />
        </>
      }
    >
      {({ close }) => (
        <>
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
            <p className="mt-1 text-xs font-medium text-primary-ink">
              {ROLE_LABEL[user?.role]}
              {user?.isDemo && ' · Demo'}
            </p>
          </div>
          <div className="py-1">
            <MenuItem icon={LuUserRound} onClick={() => { close(false); navigate('/profile'); }}>
              Profile
            </MenuItem>
            <MenuItem icon={LuSettings} onClick={() => { close(false); navigate('/settings'); }}>
              Settings
            </MenuItem>
          </div>
          <div className="border-t border-line py-1">
            <MenuItem icon={LuLogOut} tone="danger" onClick={() => { close(false); signOut(); }}>
              Sign out
            </MenuItem>
          </div>
        </>
      )}
    </Menu>
  );
};

export default UserMenu;

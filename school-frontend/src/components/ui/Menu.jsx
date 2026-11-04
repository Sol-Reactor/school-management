// Disclosure-style popover used for the user menu and notifications.
// Toggle with click/Enter/Space, close with Escape or outside click (focus returns
// to the trigger), Arrow/Home/End move between [role=menuitem] children.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * <Menu label="Account" buttonLabel="Account menu" buttonClassName="…" buttonContent={<Avatar … />}>
 *   {({ close }) => <MenuItem onClick={…}>Sign out</MenuItem>}
 * </Menu>
 */
export const Menu = ({ buttonContent, buttonLabel, buttonClassName, children, align = 'right', className, label, role = 'menu' }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  // close() only touches state; when `open` flips to false the effect below returns
  // focus to the trigger, unless the menu was dismissed by clicking elsewhere.
  const [returnFocus, setReturnFocus] = useState(true);
  const close = useCallback((restore = true) => {
    setReturnFocus(restore);
    setOpen(false);
  }, []);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (wasOpen.current && !open && returnFocus) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open, returnFocus]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close(false);
    };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    // Menus move focus to their first item; dialogs (e.g. notifications) to the panel.
    const raf = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector('[role="menuitem"]');
      if (role === 'menu' && first) first.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, role]);

  const onPanelKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]:not([disabled])')];
    if (!items.length) return;
    e.preventDefault();
    const idx = items.indexOf(document.activeElement);
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next].focus();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={buttonLabel}
        aria-haspopup={role === 'menu' ? 'menu' : 'dialog'}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={buttonClassName}
      >
        {buttonContent}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={id}
          role={role}
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          className={cn(
            'absolute top-full z-dropdown mt-2 origin-top animate-pop-in overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
};

export const MenuItem = ({ icon: Icon, children, className, tone, ...props }) => (
  <button
    type="button"
    role="menuitem"
    className={cn(
      'flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-fast hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none',
      tone === 'danger' ? 'text-danger' : 'text-ink',
      className
    )}
    {...props}
  >
    {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0 opacity-80" />}
    {children}
  </button>
);

export default Menu;

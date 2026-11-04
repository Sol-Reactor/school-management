// Accessible dialog: portal, aria-modal + labelled title, focus trapped inside,
// Escape / backdrop to close, focus returned to the trigger, body scroll locked.
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { cn } from '../../lib/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

const Modal = ({ isOpen, onClose, title, description, size = 'md', footer, children, initialFocusRef, closeOnBackdrop = true }) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Keep the latest onClose without re-running the open/focus effect on every render
  // (parents usually pass an inline function).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Focus the requested element, else the first field, else the panel.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        initialFocusRef?.current ||
        panel.querySelector('[data-autofocus]') ||
        panel.querySelector('input, select, textarea') ||
        panel;
      target.focus();
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px] dark:bg-black/60"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-pop-in flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl',
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-subtle transition-colors duration-fast hover:bg-surface-muted hover:text-ink"
          >
            <LuX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted/50 px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

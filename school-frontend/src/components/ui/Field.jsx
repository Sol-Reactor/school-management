// Form primitives with built-in labelling: every control gets a <label>,
// hints/errors are linked with aria-describedby, and errors set aria-invalid
// and are announced (role="alert") when they appear.
import { cloneElement, forwardRef, useId } from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import { cn } from '../../lib/cn';

const controlBase =
  'block w-full rounded-lg border bg-surface text-ink shadow-xs transition-colors duration-fast ' +
  'placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 ' +
  'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35';

const controlState = (invalid) =>
  invalid ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/30' : 'border-line-input';

export const Input = forwardRef(function Input({ className, invalid, icon: Icon, ...props }, ref) {
  if (!Icon) {
    return <input ref={ref} className={cn(controlBase, controlState(invalid), 'h-10 px-3 text-sm', className)} {...props} />;
  }
  return (
    <div className="relative">
      <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input ref={ref} className={cn(controlBase, controlState(invalid), 'h-10 pl-9 pr-3 text-sm', className)} {...props} />
    </div>
  );
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlBase, controlState(invalid), 'h-10 cursor-pointer pl-3 pr-8 text-sm', className)} {...props}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ className, invalid, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlBase, controlState(invalid), 'min-h-24 px-3 py-2 text-sm', className)} {...props} />;
});

/**
 * Wraps a single control with label, hint and error.
 *   <Field label="Email" error={errors.email}><Input type="email" /></Field>
 */
export const Field = ({ label, hint, error, required, optional, children, className, labelClassName }) => {
  const id = useId();
  const controlId = children.props.id ?? `${id}-control`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={controlId} className={cn('block text-sm font-medium text-ink', labelClassName)}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
        {optional && <span className="ml-1 font-normal text-ink-subtle">(optional)</span>}
      </label>
      {cloneElement(children, {
        id: controlId,
        required: required || children.props.required,
        invalid: !!error,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [hintId, errorId, children.props['aria-describedby']].filter(Boolean).join(' ') || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger">
          <LuCircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;

import { LuCircleAlert } from 'react-icons/lu';

/** Form-level error (e.g. from the server), announced when it appears. */
const FormAlert = ({ children }) =>
  children ? (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
      <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  ) : null;

export default FormAlert;

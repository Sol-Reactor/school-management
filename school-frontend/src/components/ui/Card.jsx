import { cn } from '../../lib/cn';

export const Card = ({ as: Tag = 'section', className, children, ...props }) => (
  <Tag className={cn('card', className)} {...props}>
    {children}
  </Tag>
);

/** Card header with a heading, optional description and right-aligned actions. */
export const CardHeader = ({ title, description, actions, as: Heading = 'h2', id, className }) => (
  <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
    <div className="min-w-0">
      <Heading id={id} className="text-base font-semibold text-ink">
        {title}
      </Heading>
      {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody = ({ className, children }) => <div className={cn('p-5', className)}>{children}</div>;

export default Card;

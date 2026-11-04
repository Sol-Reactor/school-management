/** Page title block: the single <h1> of every app page. */
const PageHeader = ({ title, description, actions, eyebrow }) => (
  <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 text-sm font-semibold text-primary-ink">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export default PageHeader;

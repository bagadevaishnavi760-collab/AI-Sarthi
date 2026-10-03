export default function PageHeader({ title, description, actions, badge, breadcrumb }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100">
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs font-medium text-slate-400">
            {breadcrumb}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-[26px]">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

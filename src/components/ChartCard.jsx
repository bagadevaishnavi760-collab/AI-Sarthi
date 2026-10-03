import InfoTip from './InfoTip';

export default function ChartCard({ title, subtitle, children, actions, info, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:border-slate-300 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink">
            {title} {info && <InfoTip text={info} />}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

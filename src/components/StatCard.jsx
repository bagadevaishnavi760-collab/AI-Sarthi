import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import InfoTip from './InfoTip';

// Executive KPI card with optional trend indicator, context text and drill-down link.
export default function StatCard({ title, value, subtitle, icon: Icon, tone = 'secondary', trend, trendLabel, to, info }) {
  const tones = {
    secondary: {
      bg: 'bg-blue-50/80 text-secondary border-blue-100',
      pill: 'bg-blue-500/10 text-secondary',
      borderTop: 'group-hover:border-t-secondary',
    },
    success: {
      bg: 'bg-emerald-50/80 text-emerald-700 border-emerald-100',
      pill: 'bg-emerald-500/10 text-emerald-700',
      borderTop: 'group-hover:border-t-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50/80 text-amber-800 border-amber-100',
      pill: 'bg-amber-500/10 text-amber-800',
      borderTop: 'group-hover:border-t-amber-500',
    },
    critical: {
      bg: 'bg-rose-50/80 text-rose-700 border-rose-100',
      pill: 'bg-rose-500/10 text-rose-700',
      borderTop: 'group-hover:border-t-rose-500',
    },
    primary: {
      bg: 'bg-slate-100/90 text-primary border-slate-200',
      pill: 'bg-slate-500/10 text-primary',
      borderTop: 'group-hover:border-t-primary',
    },
    accent: {
      bg: 'bg-orange-50/80 text-accent border-orange-100',
      pill: 'bg-orange-500/10 text-accent',
      borderTop: 'group-hover:border-t-accent',
    },
  };

  const currentTone = tones[tone] || tones.secondary;

  const cardContent = (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-cardHover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            {title} {info && <InfoTip text={info} />}
          </p>
          <p className="tabular mt-2 text-2xl font-bold tracking-tight text-ink sm:text-[26px]">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${currentTone.bg} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100/80">
        <div className="flex items-center gap-2">
          {typeof trend === 'number' && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                trend >= 0
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
              }`}
            >
              {trend >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
              {trend >= 0 ? `+${Math.abs(trend)}%` : `-${Math.abs(trend)}%`}
            </span>
          )}
          {(trendLabel || subtitle) && (
            <span className="text-xs text-slate-500">{trendLabel || subtitle}</span>
          )}
        </div>

        {to && (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            View <ArrowUpRight size={13} />
          </span>
        )}
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block focus:outline-none" aria-label={`${title} details`}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

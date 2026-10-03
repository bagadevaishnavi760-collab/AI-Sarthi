import { ChevronDown } from 'lucide-react';

// Shared styled select control used across filters.
export default function Select({ label, value, onChange, options, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
      {label && <span>{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200/90 bg-white py-2 pl-3 pr-9 text-sm font-medium normal-case tracking-normal text-ink shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 hover:border-slate-300"
        >
          {options.map((opt) =>
            typeof opt === 'string' ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ),
          )}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

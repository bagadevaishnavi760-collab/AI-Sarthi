import { FileQuestion, AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No data available', message = 'Try adjusting your filters.' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
        <FileQuestion size={22} />
      </div>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-critical">
        <AlertCircle size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-rose-900">Unable to load data</p>
        <p className="mt-0.5 text-xs text-rose-700">{message || 'An unexpected error occurred while fetching information.'}</p>
      </div>
    </div>
  );
}

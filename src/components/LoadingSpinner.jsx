export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-secondary border-r-secondary/40" />
        <div className="absolute h-6 w-6 rounded-full bg-secondary/10 animate-pulse" />
      </div>
      <p className="mt-3.5 text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
    </div>
  );
}

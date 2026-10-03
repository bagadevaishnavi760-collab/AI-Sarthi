import { useState } from 'react';
import { Info } from 'lucide-react';

// Lightweight hover/focus tooltip for explaining technical metrics.
export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="More information"
        className="text-slate-400 hover:text-secondary"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      >
        <Info size={14} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-lg bg-primaryDark px-3 py-2 text-xs font-normal text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

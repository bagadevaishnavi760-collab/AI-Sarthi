import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, ExternalLink, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TITLES = {
  '/': 'AI Sarthi Portal',
  '/dashboard': 'Overview Dashboard',
  '/overview': 'Overview Dashboard',
  '/state-analysis': 'State Analysis',
  '/budget-analytics': 'Budget Analytics',
  '/predictions': 'ML Predictions',
  '/recommendations': 'AI Recommendations',
  '/document-chat': 'Document Intelligence',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen, demoMode } = useApp();
  const { pathname } = useLocation();

  const currentTitle = TITLES[pathname] || 'Healthcare Intelligence';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>AI Sarthi</span>
            <span>/</span>
            <span className="text-secondary font-semibold">{currentTitle}</span>
          </div>
          <h1 className="text-base font-bold tracking-tight text-ink sm:text-lg">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden w-64 md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search states, reports..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-12 text-xs text-ink placeholder-slate-400 transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            ⌘K
          </kbd>
        </div>

        {demoMode ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Demo data mode
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live API mode
          </span>
        )}

        <Link
          to="/"
          className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors"
          title="Return to Public Landing Page"
        >
          <ExternalLink size={13} />
          <span>Landing Portal</span>
        </Link>

        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
            GOI
          </div>
          <div className="hidden text-left xl:block">
            <p className="text-xs font-semibold leading-tight text-ink">Govt Administrator</p>
            <p className="text-[10px] font-medium text-slate-400">MoHFW, New Delhi</p>
          </div>
        </div>
      </div>
    </header>
  );
}

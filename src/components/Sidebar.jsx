import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Map, BarChart3, BrainCircuit, Sparkles,
  MessageSquareText, FileText, Settings, ChevronLeft, Activity, Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_GROUPS = [
  {
    group: 'Analytics & Planning',
    items: [
      { to: '/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
      { to: '/state-analysis', label: 'State Analysis', icon: Map },
      { to: '/budget-analytics', label: 'Budget Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'AI & Intelligence',
    items: [
      { to: '/predictions', label: 'ML Predictions', icon: BrainCircuit },
      { to: '/recommendations', label: 'AI Recommendations', icon: Sparkles },
      { to: '/document-chat', label: 'Document Intelligence', icon: MessageSquareText },
    ],
  },
  {
    group: 'Operations',
    items: [
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-800/80 bg-[#0B1A2F] text-white transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-[68px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md ring-1 ring-white/20">
          <Activity size={20} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">AI Sarthi</span>
              <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-orange-400 ring-1 ring-orange-500/30">
                MoHFW
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Budget Decision Support</p>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary Navigation">
        {NAV_GROUPS.map((sec) => (
          <div key={sec.group} className="space-y-1">
            {sidebarOpen && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {sec.group}
              </p>
            )}
            {sec.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={18} className="shrink-0 transition-transform group-hover:scale-105" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Public Portal Link */}
        <div className="pt-2 border-t border-white/10">
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-150"
            title={!sidebarOpen ? 'Public Landing Page' : undefined}
          >
            <Globe size={18} className="shrink-0 text-slate-400 group-hover:text-blue-400" />
            {sidebarOpen && <span className="truncate">Public Landing Page</span>}
          </Link>
        </div>
      </nav>

      {/* Footer Collapse Button */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}
          />
          {sidebarOpen && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

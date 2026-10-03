import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const { demoMode, setDemoMode } = useApp();
  const [notifications, setNotifications] = useState({ email: true, reports: true, alerts: false });
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="System Settings & Preferences"
        description="Manage your administrative profile, telemetry modes, notifications, and application appearance."
        breadcrumb="Operations / Settings"
      />

      {/* User Profile Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2">
          Administrator Identity
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-800 text-lg font-bold text-white shadow-md">
            GOI
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-ink">Government Administrator</h4>
            <p className="text-xs text-slate-500">Ministry of Health & Family Welfare (MoHFW)</p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                Authorized Officer Level 4
              </span>
              <span className="text-[11px] text-slate-400">Nirman Bhawan, New Delhi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Application Telemetry & Demo Mode */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">
          Data Engine & Telemetry Preferences
        </h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-ink">Demonstration Data Mode</p>
            <p className="text-xs text-slate-500 max-w-lg mt-0.5 leading-relaxed">
              When enabled, displays normalized demo healthcare allocation figures whenever the live FastAPI backend is offline.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
          </label>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">
          Notifications & Alerts
        </h3>
        <div className="divide-y divide-slate-100">
          {Object.entries(notifications).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-ink capitalize">{key} Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receive {key} digests regarding fiscal absorption anomalies and report generation.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Theme Selection */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">
          Visual Interface Theme
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Select preferred contrast and color scheme mode.
        </p>
        <div className="flex gap-3">
          {['light', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-xl border px-5 py-2.5 text-xs font-semibold capitalize transition-all ${
                theme === t
                  ? 'border-secondary bg-blue-50/80 text-secondary shadow-xs ring-1 ring-secondary/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t} Appearance
            </button>
          ))}
        </div>
      </section>

      {/* Save Action */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          className="rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-card hover:bg-primaryLight hover:shadow-cardHover transition-all"
        >
          Save Preferences
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-600/20">
            ✓ Preferences saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

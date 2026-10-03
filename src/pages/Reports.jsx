import { useState } from 'react';
import { Eye, Download, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import RiskBadge from '../components/RiskBadge';
import PageHeader from '../components/PageHeader';
import { sampleReports } from '../data/mockData';

export default function Reports() {
  const [preview, setPreview] = useState(null);

  const columns = [
    {
      key: 'title',
      label: 'Report Title',
      render: (r) => (
        <span className="font-semibold text-ink hover:text-secondary cursor-pointer" onClick={() => setPreview(r)}>
          {r.title}
        </span>
      ),
    },
    { key: 'state', label: 'Jurisdiction' },
    {
      key: 'type',
      label: 'Classification',
      render: (r) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {r.type}
        </span>
      ),
    },
    { key: 'date', label: 'Generated Date' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <RiskBadge level={r.status} />,
    },
    {
      key: 'view',
      label: 'Inspection',
      render: (r) => (
        <button
          onClick={() => setPreview(r)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-blue-50 transition-colors"
        >
          <Eye size={13} /> View
        </button>
      ),
    },
    {
      key: 'download',
      label: 'Export',
      render: () => (
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download size={13} /> PDF
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Reports Repository"
        description="Searchable archive of generated health budget reviews, state analysis dossiers, ML forecasts, and AI recommendation briefs."
        breadcrumb="Operations / Reports"
      />

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Reports</span>
          <p className="tabular mt-1 text-2xl font-bold text-ink">{sampleReports.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Validated</span>
          <p className="tabular mt-1 text-2xl font-bold text-emerald-700">
            {sampleReports.filter((r) => r.status === 'Generated').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pending Review</span>
          <p className="tabular mt-1 text-2xl font-bold text-amber-700">
            {sampleReports.filter((r) => r.status === 'Draft').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Export Engine</span>
          <p className="mt-1 text-sm font-bold text-secondary">PDF / Print Ready</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <DataTable
          columns={columns}
          rows={sampleReports.map((r) => ({ ...r, key: r.id }))}
          searchPlaceholder="Search generated reports by state, title, type..."
        />
      </div>

      {/* Modern Modal Preview Dialog */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="modal-enter w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Official Dossier Preview
                </span>
                <h3 className="mt-1 text-lg font-bold text-ink">{preview.title}</h3>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Jurisdiction</span>
                <p className="font-bold text-ink mt-0.5">{preview.state}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Report Type</span>
                <p className="font-bold text-ink mt-0.5">{preview.type}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Generated Timestamp</span>
                <p className="font-bold text-ink mt-0.5">{preview.date}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Approval Status</span>
                <div className="mt-1">
                  <RiskBadge level={preview.status} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-1">Executive Document Summary</p>
              <p>
                This dossier captures the synthesized findings for <strong>{preview.state}</strong> under the <strong>{preview.type}</strong> framework. It contains vetted financial allocations, historical absorption velocity, and AI-assisted recommendations aligned with current MoHFW guidelines.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primaryLight transition-colors"
              >
                <Download size={13} />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

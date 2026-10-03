import { useState } from 'react';
import { Download, RefreshCw, FileSearch, Sparkles } from 'lucide-react';
import StateSelector from '../components/StateSelector';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateRecommendation } from '../services/recommendationService';
import { getStateData, utilizationPercent, STATE_NAMES, FINANCIAL_YEARS } from '../data/mockData';

const inr = (v) => `₹${v.toLocaleString('en-IN')} Cr`;
const PRIORITIES = ['Primary Healthcare', 'Infrastructure', 'Manpower & Training', 'Disease Prevention', 'Maternal & Child Health'];

export default function Recommendations() {
  const [state, setState] = useState(STATE_NAMES[0]);
  const [year, setYear] = useState(FINANCIAL_YEARS[3]);
  const [priority, setPriority] = useState(PRIORITIES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showEvidence, setShowEvidence] = useState(true);

  const stateData = getStateData(state);

  const run = async () => {
    setLoading(true);
    setResult(null);
    const res = await generateRecommendation({ state, year, priority, allocated: stateData?.allocated, utilized: stateData?.utilized });
    setResult(res);
    setLoading(false);
  };

  const section = (title, children) => (
    <div className="space-y-2 border-b border-slate-100 pb-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Budget Recommendations"
        description="Evidence-grounded allocation and planning guidance synthesized from official MoHFW documents and historical spending."
        breadcrumb="AI & Intelligence / Recommendations"
      />

      {/* Governance Notice */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">
          !
        </div>
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950">Administrative Notice:</strong> AI-generated recommendations are decision-support outputs and require verification and approval by authorized Ministry officials before execution.
        </p>
      </div>

      {/* Input Parameters Surface */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StateSelector value={state} onChange={setState} options={STATE_NAMES} />
          <Select label="Financial Year" value={year} onChange={setYear} options={FINANCIAL_YEARS} />
          <Select label="Healthcare Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          {stateData && (
            <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">State Baseline</span>
              <div className="mt-1 flex items-center justify-between">
                <span>Sanctioned:</span>
                <strong className="text-ink">{inr(stateData.allocated)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Utilization:</span>
                <strong className="text-secondary">{utilizationPercent(stateData)}%</strong>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Click generate to synthesize optimal allocation focus based on {state}'s health profile.
          </p>
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-card hover:bg-primaryLight hover:shadow-cardHover transition-all disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{loading ? 'Synthesizing Guidance...' : 'Generate Recommendation'}</span>
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner label="Evaluating state parameters against MoHFW guidelines..." />}

      {result && !loading && (
        <div className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink sm:text-xl">
                  AI Planning Recommendation Summary
                </h3>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-secondary ring-1 ring-blue-500/20">
                  {result.priorityClassification}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Target: {state} · Financial Year: {year} · Focus Domain: {priority}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                result.mode === 'api'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-amber-50 text-amber-800 ring-amber-600/20'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${result.mode === 'api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {result.mode === 'api' ? 'Live Recommendation Engine' : 'Demonstration Mode'}
            </span>
          </div>

          {result.note && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/60 leading-relaxed">
              {result.note}
            </p>
          )}

          {/* 1. Executive Summary */}
          {section(
            'Executive Summary',
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              {result.executiveSummary}
            </div>
          )}

          {/* 2. Recommended Action Steps */}
          {section(
            'Recommended Action Plan',
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {result.recommendedActions.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-secondary">
                    {i + 1}
                  </span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Suggested Allocation Focus */}
          {section(
            'Suggested Allocation Focus',
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.suggestedAllocationFocus.map((a) => (
                  <div key={a.category} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">{a.category}</span>
                      <strong className="text-secondary">{a.percentage}%</strong>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-500"
                        style={{ width: `${a.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-medium text-slate-400 text-right">
                Total Share: {result.suggestedAllocationFocus.reduce((s, a) => s + a.percentage, 0)}% (reallocation normalization)
              </p>
            </div>
          )}

          {/* 4. Supporting Reasoning */}
          {section(
            'Supporting Analytical Reasoning',
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {result.supportingReasoning}
            </p>
          )}

          {/* 5. Document Citations & Evidence */}
          {showEvidence &&
            section(
              'Evidence & Grounding from Government Documents',
              <div className="space-y-2.5">
                {result.evidenceFromDocuments.map((e, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-primary">{e.document}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {e.section}
                      </span>
                    </div>
                    <p className="text-xs italic text-slate-500 leading-relaxed">"{e.snippet}"</p>
                  </div>
                ))}
              </div>
            )}

          {/* 6. Assumptions & Limitations */}
          {section(
            'Assumptions and Methodological Constraints',
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500 leading-relaxed">
              {result.assumptionsAndLimitations.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={run}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primaryLight transition-colors"
              >
                <RefreshCw size={14} />
                <span>Regenerate Analysis</span>
              </button>
              <button
                onClick={() => setShowEvidence((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <FileSearch size={14} />
                <span>{showEvidence ? 'Hide Citations' : 'View Citations'}</span>
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Download size={14} />
              <span>Export Executive Brief</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, AlertCircle, Building2, Wallet, Landmark, Gauge } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import StateSelector from '../components/StateSelector';
import Select from '../components/Select';
import PlotlyChart from '../components/PlotlyChart';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState } from '../components/StateMessage';
import { getBudgetByState } from '../services/budgetService';
import { useAsync } from '../hooks/useAsync';
import { STATE_NAMES, FINANCIAL_YEARS, infrastructureIndicators } from '../data/mockData';

const inr = (v) => `₹${v.toLocaleString('en-IN')} Cr`;

const BURDEN_LABEL = (v) => (v >= 75 ? 'High' : v >= 60 ? 'Moderate' : 'Low');

export default function StateAnalysis() {
  const [searchParams] = useSearchParams();
  const initial = STATE_NAMES.includes(searchParams.get('state')) ? searchParams.get('state') : STATE_NAMES[0];
  const [state, setState] = useState(initial);
  const [year, setYear] = useState(FINANCIAL_YEARS[3]);
  const { data, loading, error } = useAsync(() => getBudgetByState(state), [state]);

  if (loading) return <LoadingSpinner label="Loading state data..." />;
  if (error) return <ErrorState message={error} />;

  const d = data?.data;
  if (!d) return <EmptyState title="State not found" message="No budget data for the selected state." />;

  const util = Math.round((d.utilized / d.allocated) * 100);
  const remaining = d.allocated - d.utilized;
  const infra = infrastructureIndicators[d.state] || { beds: 0, doctors: 0, diagnostics: 0, facilities: 0 };
  const history = d.history || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${state} — Healthcare Analysis`}
        description="Detailed financial absorption, epidemiological burden, and health infrastructure indicators."
        breadcrumb="Analytics & Planning / State Drilldown"
        badge={
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            data.source === 'api'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-amber-50 text-amber-800 ring-amber-600/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${data.source === 'api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {data.source === 'api' ? 'Live API Source' : 'Demonstration Data'}
          </span>
        }
      />

      {/* State & Year Filter Surface */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-100 pb-3">
          <div className="w-full sm:w-64">
            <StateSelector value={state} onChange={setState} options={STATE_NAMES} />
          </div>
          <div className="w-full sm:w-48">
            <Select label="Financial Year" value={year} onChange={setYear} options={FINANCIAL_YEARS} />
          </div>
        </div>

        {/* Fast State Quick-Switcher Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Quick Select:
          </span>
          {STATE_NAMES.slice(0, 6).map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                state === s
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Sanctioned Allocation"
          value={inr(d.allocated)}
          icon={Wallet}
          subtitle={`FY ${year}`}
        />
        <StatCard
          title="Reported Expenditure"
          value={inr(d.utilized)}
          icon={Landmark}
          tone="success"
          subtitle="Cumulative spent"
        />
        <StatCard
          title="Fiscal Absorption"
          value={`${util}%`}
          icon={Gauge}
          tone={util >= 75 ? 'success' : util >= 68 ? 'warning' : 'critical'}
          subtitle={util >= 75 ? 'Optimal absorption' : 'Underspending risk'}
        />
        <StatCard
          title="Unspent Balance"
          value={inr(remaining)}
          icon={Wallet}
          tone={remaining > 0 ? 'accent' : 'primary'}
          subtitle="Remaining allocation"
        />
        <StatCard
          title="Population Base"
          value={(d.population / 10000000).toFixed(1) + ' Cr'}
          icon={Users}
          subtitle="Census estimate"
        />
        <StatCard
          title="Disease Burden Score"
          value={`${BURDEN_LABEL(d.diseaseBurden)} (${d.diseaseBurden}/100)`}
          icon={AlertCircle}
          tone="critical"
          subtitle="Epidemiological index"
        />
        <StatCard
          title="Infrastructure Index"
          value={`${d.infrastructureIndex} / 100`}
          icon={Building2}
          tone="success"
          subtitle="Facility readiness"
        />
      </div>

      {/* Visual Charts & State Summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Historical Budget Trajectory"
          subtitle="Sanctioned vs Utilized over the last 4 financial cycles"
        >
          <PlotlyChart
            data={[
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Sanctioned',
                x: history.map((h) => h.year),
                y: history.map((h) => h.allocated),
                line: { color: '#0F2745', width: 2.5 },
                marker: { size: 6, color: '#0F2745' },
              },
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Utilized',
                x: history.map((h) => h.year),
                y: history.map((h) => h.utilized),
                line: { color: '#10B981', width: 2.5 },
                marker: { size: 6, color: '#10B981' },
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Allocation vs Expenditure"
          subtitle={`₹ Crores · ${d.state} in FY ${year}`}
        >
          <PlotlyChart
            data={[
              {
                type: 'bar',
                name: 'Sanctioned',
                x: [d.state],
                y: [d.allocated],
                marker: { color: '#0F2745' },
              },
              {
                type: 'bar',
                name: 'Utilized',
                x: [d.state],
                y: [d.utilized],
                marker: { color: '#2563EB' },
              },
            ]}
            layout={{ barmode: 'group', bargap: 0.4 }}
          />
        </ChartCard>

        <ChartCard
          title="Healthcare Infrastructure Indicators"
          subtitle="Readiness index across 4 core facility dimensions (0–100)"
        >
          <PlotlyChart
            data={[
              {
                type: 'bar',
                x: ['Hospital Beds', 'Doctors', 'Diagnostics', 'Facilities'],
                y: [infra.beds, infra.doctors, infra.diagnostics, infra.facilities],
                marker: {
                  color: ['#0F2745', '#2563EB', '#10B981', '#F59E0B'],
                },
              },
            ]}
            layout={{ yaxis: { range: [0, 100], title: 'Capacity Score' } }}
          />
        </ChartCard>

        <ChartCard
          title="State Performance Brief"
          subtitle="Automated analytical summary for administrative review"
        >
          <div className="space-y-3.5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-semibold text-blue-950">
                {d.state} Health Profile Overview
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {d.state} has utilized <strong>{util}%</strong> of its sanctioned healthcare allocation of <strong>{inr(d.allocated)}</strong> during FY {year}.
                The state registers a <strong>{BURDEN_LABEL(d.diseaseBurden).toLowerCase()}</strong> disease burden with an infrastructure readiness score of <strong>{d.infrastructureIndex}/100</strong>.
                {remaining > 0 && ` An estimated ${inr(remaining)} remains unspent in state treasury accounts.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Absorption Health</span>
                <p className="font-bold text-ink mt-0.5">{util >= 75 ? 'Healthy' : util >= 68 ? 'Moderate' : 'Under Observation'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Disease Burden</span>
                <p className="font-bold text-ink mt-0.5">{BURDEN_LABEL(d.diseaseBurden)} ({d.diseaseBurden})</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Data generated from demonstration baseline models. Live API records automatically update when connected.
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

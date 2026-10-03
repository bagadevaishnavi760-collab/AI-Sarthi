import { useState } from 'react';
import ChartCard from '../components/ChartCard';
import StateSelector from '../components/StateSelector';
import PlotlyChart from '../components/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import Select from '../components/Select';
import { ErrorState } from '../components/StateMessage';
import { getStates } from '../services/budgetService';
import { useAsync } from '../hooks/useAsync';
import {
  STATE_NAMES, FINANCIAL_YEARS, HEALTHCARE_SECTORS,
  yearlyTrends, sectorAllocation, utilizationPercent,
} from '../data/mockData';

const ALL = 'All States';

export default function BudgetAnalytics() {
  const [state, setState] = useState(ALL);
  const [year, setYear] = useState(FINANCIAL_YEARS[3]);
  const [sector, setSector] = useState(HEALTHCARE_SECTORS[0]);
  const { data, loading, error } = useAsync(() => getStates(), []);

  if (loading) return <LoadingSpinner label="Loading budget analytics..." />;
  if (error) return <ErrorState message={error} />;

  const states = state === ALL ? data.states : data.states.filter((s) => s.state === state);
  const utilizationValues = data.states.map((s) => utilizationPercent(s));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget & Expenditure Analytics"
        description="Multi-dimensional analysis comparing allocations, actual expenditures, and fiscal trends across sectors and states."
        breadcrumb="Analytics & Planning / Budget Analytics"
      />

      {/* Multi-Dimensional Filter Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StateSelector value={state} onChange={setState} options={[ALL, ...STATE_NAMES]} />
          <Select label="Financial Year" value={year} onChange={setYear} options={FINANCIAL_YEARS} />
          <Select label="Healthcare Sector" value={sector} onChange={setSector} options={HEALTHCARE_SECTORS} />
        </div>

        {/* Filter Summary Context Pill */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            <span>Scope: <strong className="text-ink">{state}</strong> · FY <strong className="text-ink">{year}</strong> · Sector: <strong className="text-ink">{sector}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400">
            {states.length} {states.length === 1 ? 'state record loaded' : 'states aggregated'}
          </span>
        </div>
      </div>

      {/* Analytics Chart Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Sanctioned vs Utilized Budget"
          subtitle={`₹ Crores · ${state} perspective`}
        >
          <PlotlyChart
            data={[
              {
                type: 'bar',
                name: 'Sanctioned',
                x: states.map((s) => s.state),
                y: states.map((s) => s.allocated),
                marker: { color: '#0F2745' },
              },
              {
                type: 'bar',
                name: 'Utilized',
                x: states.map((s) => s.state),
                y: states.map((s) => s.utilized),
                marker: { color: '#2563EB' },
              },
            ]}
            layout={{
              barmode: 'group',
              xaxis: { tickangle: -35 },
              bargap: 0.25,
            }}
          />
        </ChartCard>

        <ChartCard
          title="Multi-Year National Budget Trends"
          subtitle="Sanctioned allocation vs actual expenditure over 4 FYs"
        >
          <PlotlyChart
            data={[
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Sanctioned',
                x: yearlyTrends.map((t) => t.year),
                y: yearlyTrends.map((t) => t.allocated),
                line: { color: '#0F2745', width: 2.5 },
                marker: { size: 6, color: '#0F2745' },
              },
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Utilized',
                x: yearlyTrends.map((t) => t.year),
                y: yearlyTrends.map((t) => t.utilized),
                line: { color: '#10B981', width: 2.5 },
                marker: { size: 6, color: '#10B981' },
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="National Healthcare Sector Outlay"
          subtitle="Proportion by primary, secondary, tertiary & mission heads"
        >
          <PlotlyChart
            data={[
              {
                type: 'pie',
                hole: 0.45,
                labels: sectorAllocation.map((s) => s.sector),
                values: sectorAllocation.map((s) => s.value),
                textinfo: 'label+percent',
                textposition: 'outside',
                automargin: true,
              },
            ]}
            layout={{
              showlegend: false,
              margin: { t: 20, r: 20, b: 20, l: 20 },
            }}
          />
        </ChartCard>

        <ChartCard
          title="State Absorption Comparison"
          subtitle="% of allocated budget utilized per state"
        >
          <PlotlyChart
            data={[
              {
                type: 'bar',
                orientation: 'h',
                x: [...data.states].map((s) => utilizationPercent(s)),
                y: [...data.states].map((s) => s.state),
                marker: { color: '#2563EB' },
              },
            ]}
            layout={{
              margin: { l: 120, r: 20, t: 20, b: 40 },
              xaxis: { title: 'Utilization %', range: [0, 100] },
            }}
          />
        </ChartCard>

        <ChartCard
          title="Utilization Frequency Distribution"
          subtitle="Distribution of state absorption rates across bins"
          className="xl:col-span-2"
        >
          <PlotlyChart
            data={[
              {
                type: 'histogram',
                x: utilizationValues,
                marker: { color: '#0F2745' },
                nbinsx: 8,
              },
            ]}
            layout={{
              xaxis: { title: 'Utilization Rate (%)' },
              yaxis: { title: 'Number of States' },
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}

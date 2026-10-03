import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Landmark, Gauge, AlertTriangle, ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import PlotlyChart from '../components/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import { EmptyState, ErrorState } from '../components/StateMessage';
import { getDashboardData } from '../services/budgetService';
import { useAsync } from '../hooks/useAsync';
import { utilizationPercent, riskLevel } from '../data/mockData';

const inr = (v) => `₹${v.toLocaleString('en-IN')} Cr`;

export default function Dashboard() {
  const { data, loading, error } = useAsync(() => getDashboardData(), []);
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const states = data.states;
  const totalAllocated = states.reduce((a, s) => a + s.allocated, 0);
  const totalUtilized = states.reduce((a, s) => a + s.utilized, 0);
  const avgUtil = Math.round((totalUtilized / totalAllocated) * 100);
  const highRisk = states.filter((s) => riskLevel(s) === 'High').length;

  // Trend deltas derived from the last two financial years of demo data.
  const t = data.yearlyTrends;
  const last = t[t.length - 1];
  const prev = t[t.length - 2];
  const trend = (a, b) => Math.round(((a - b) / b) * 100);
  const utilTrend = Math.round((last.utilized / last.allocated - prev.utilized / prev.allocated) * 100);

  const goState = (point) => {
    const name = point?.x ?? point?.y;
    if (name) navigate(`/state-analysis?state=${encodeURIComponent(name)}`);
  };

  const columns = [
    { key: 'state', label: 'State' },
    { key: 'allocated', label: 'Allocated', render: (r) => inr(r.allocated), sortValue: (r) => r.allocated },
    { key: 'utilized', label: 'Utilized', render: (r) => inr(r.utilized), sortValue: (r) => r.utilized },
    { key: 'utilPct', label: 'Utilization %', render: (r) => `${utilizationPercent(r)}%`, sortValue: (r) => utilizationPercent(r) },
    { key: 'risk', label: 'Risk Level', render: (r) => <RiskBadge level={riskLevel(r)} />, sortValue: (r) => riskLevel(r) },
    {
      key: 'view',
      label: 'Details',
      sortValue: () => '',
      render: (r) => (
        <Link to={`/state-analysis?state=${encodeURIComponent(r.state)}`} className="text-secondary hover:underline">
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Budget Overview"
        description="National expenditure tracking across 12 demonstration states — allocation vs expenditure, trends and risk analysis."
        breadcrumb="Planning & Administration / Overview"
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

      {/* Official Advisory Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/60 p-4 text-xs text-blue-900 shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 font-bold text-xs">
          i
        </div>
        <p className="leading-relaxed">
          <strong className="font-semibold text-blue-950">Notice for Health Administrators:</strong> Figures displayed represent demonstration fiscal baselines for system testing and evaluation. Live API responses override demonstration fallbacks automatically when the FastAPI backend is connected.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sanctioned Budget"
          value={inr(totalAllocated)}
          trend={trend(last.allocated, prev.allocated)}
          trendLabel="vs previous FY"
          icon={Wallet}
          to="/budget-analytics"
          info="Aggregate sanctioned healthcare budget across all demo states for the latest financial year."
        />
        <StatCard
          title="Total Expenditure"
          value={inr(totalUtilized)}
          trend={trend(last.utilized, prev.utilized)}
          trendLabel="vs previous FY"
          icon={Landmark}
          tone="success"
          to="/budget-analytics"
          info="Actual spending reported across demo states for the latest financial year."
        />
        <StatCard
          title="National Absorption"
          value={`${avgUtil}%`}
          trend={utilTrend}
          trendLabel="pp vs previous FY"
          icon={Gauge}
          tone={avgUtil >= 75 ? 'success' : 'warning'}
          info="Utilized amount as a share of allocated budget, averaged across demo states."
        />
        <StatCard
          title="High-Risk States"
          value={highRisk}
          subtitle="Absorption rate under 68%"
          icon={AlertTriangle}
          tone="critical"
          to="/state-analysis"
          info="States whose utilization rate indicates elevated risk of underspending (demo classification)."
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Allocated vs Utilized Budget by State"
          subtitle="₹ Crores · Interactive: click any bar to drill into state details"
          info="Compares sanctioned allocation against actual expenditure per state."
        >
          <PlotlyChart
            onPointClick={goState}
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
              bargroupgap: 0.1,
            }}
          />
        </ChartCard>

        <ChartCard
          title="Yearly Budget Trajectory"
          subtitle="₹ Crores · 5-year macro perspective"
          info="Five-year direction of sanctioned vs utilized healthcare funds."
        >
          <PlotlyChart
            data={[
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Sanctioned',
                x: t.map((x) => x.year),
                y: t.map((x) => x.allocated),
                line: { color: '#0F2745', width: 2.5 },
                marker: { size: 6, color: '#0F2745' },
              },
              {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Utilized',
                x: t.map((x) => x.year),
                y: t.map((x) => x.utilized),
                line: { color: '#10B981', width: 2.5 },
                marker: { size: 6, color: '#10B981' },
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Healthcare Sector Allocation"
          subtitle="Proportional distribution of the national outlay"
          info="Distribution of health outlays across NHM, medical education, disease control, and primary facilities."
        >
          <PlotlyChart
            data={[
              {
                type: 'pie',
                hole: 0.5,
                labels: data.sectorAllocation.map((s) => s.sector),
                values: data.sectorAllocation.map((s) => s.value),
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
          title="State Utilization Ranking"
          subtitle="% of allocated budget utilized (ascending order)"
          info="States ranked by fiscal absorption percentage. Click any row or bar to inspect state indicators."
        >
          <PlotlyChart
            onPointClick={goState}
            data={[
              {
                type: 'bar',
                orientation: 'h',
                x: [...states].sort((a, b) => utilizationPercent(a) - utilizationPercent(b)).map((s) => utilizationPercent(s)),
                y: [...states].sort((a, b) => utilizationPercent(a) - utilizationPercent(b)).map((s) => s.state),
                marker: {
                  color: [...states].sort((a, b) => utilizationPercent(a) - utilizationPercent(b)).map((s) => {
                    const pct = utilizationPercent(s);
                    return pct < 68 ? '#EF4444' : pct < 78 ? '#F59E0B' : '#10B981';
                  }),
                },
              },
            ]}
            layout={{
              margin: { l: 120, r: 20, t: 20, b: 40 },
              xaxis: { title: 'Utilization %', range: [0, 100] },
            }}
          />
        </ChartCard>
      </div>

      {/* State Performance Interactive Table */}
      <ChartCard
        title="State Performance Directory"
        subtitle="Searchable and sortable registry of all monitored states"
      >
        <DataTable
          columns={columns}
          rows={states.map((s) => ({ ...s, key: s.state }))}
          searchPlaceholder="Search state records..."
        />
      </ChartCard>

      {/* Quick Action Decision Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'State Analysis Drilldown',
            to: '/state-analysis',
            desc: 'Inspect demographics, disease burden & infrastructure index',
          },
          {
            label: 'Generate AI Recommendations',
            to: '/recommendations',
            desc: 'Synthesize planning guidance grounded in MoHFW documents',
          },
          {
            label: 'Query Document Intelligence',
            to: '/document-chat',
            desc: 'Ask questions with citation references from official guidelines',
          },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-cardHover"
          >
            <div>
              <span className="block text-sm font-bold text-ink group-hover:text-secondary transition-colors">
                {a.label}
              </span>
              <span className="mt-1 block text-xs text-slate-500 leading-relaxed">
                {a.desc}
              </span>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-secondary transition-transform group-hover:translate-x-1">
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

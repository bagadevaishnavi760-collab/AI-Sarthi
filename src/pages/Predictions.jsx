import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuit } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import PlotlyChart from '../components/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import { predictBudgetUtilization, getPredictionServiceHealth } from '../services/predictionService';
import { STATE_NAMES, demoPredictionHistory } from '../data/mockData';

// Provisional schema — easy to adjust once the ML API fixes its contract.
const schema = z.object({
  state: z.string().min(1, 'Select a state'),
  allocatedBudget: z.coerce.number().positive('Must be > 0'),
  previousUtilization: z.coerce.number().min(0).max(100, '0–100'),
  population: z.coerce.number().positive('Must be > 0'),
  diseaseBurden: z.coerce.number().min(0).max(100, '0–100'),
  infrastructureIndex: z.coerce.number().min(0).max(100, '0–100'),
});

export default function Predictions() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(null);
  const [serviceHealth, setServiceHealth] = useState('checking'); // 'checking' | 'available' | 'unavailable'

  useEffect(() => {
    getPredictionServiceHealth().then((h) => setServiceHealth(h.available ? 'available' : 'unavailable'));
  }, []);

  const fillSample = (stateName = 'Uttar Pradesh') => {
    setValue('state', stateName);
    setValue('allocatedBudget', 24500);
    setValue('previousUtilization', 76);
    setValue('population', 241000000);
    setValue('diseaseBurden', 78);
    setValue('infrastructureIndex', 62);
  };

  const onSubmit = async (values) => {
    setLoading(true);
    setResult(null);
    setInputs(values);
    const res = await predictBudgetUtilization(values);
    setResult(res);
    setLoading(false);
  };

  const fields = [
    { name: 'allocatedBudget', label: 'Allocated Budget', unit: '₹ Crores', placeholder: 'e.g. 24500' },
    { name: 'previousUtilization', label: 'Previous FY Utilization', unit: '0 – 100%', placeholder: 'e.g. 76' },
    { name: 'population', label: 'State Population', unit: 'Total Headcount', placeholder: 'e.g. 241000000' },
    { name: 'diseaseBurden', label: 'Disease Burden Index', unit: 'Score 0 – 100', placeholder: 'e.g. 78' },
    { name: 'infrastructureIndex', label: 'Infrastructure Index', unit: 'Score 0 – 100', placeholder: 'e.g. 62' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ML Budget Utilization Prediction"
        description="Machine learning forecasting of year-end budget absorption using XGBoost regression models."
        breadcrumb="AI & Intelligence / ML Predictions"
        badge={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              serviceHealth === 'available'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : serviceHealth === 'unavailable'
                  ? 'bg-amber-50 text-amber-800 ring-amber-600/20'
                  : 'bg-slate-100 text-slate-600 ring-slate-500/20'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${serviceHealth === 'available' ? 'bg-emerald-500' : serviceHealth === 'unavailable' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            Prediction service: {serviceHealth === 'available' ? 'Available' : serviceHealth === 'unavailable' ? 'Demo mode (offline)' : 'Checking…'}
          </span>
        }
      />

      {/* Advisory Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold">
          i
        </div>
        <p className="leading-relaxed">
          Input fields follow the provisional ML inference schema. In offline or local development mode, a calibrated baseline response is displayed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-ink">Inference Parameters</h3>
                <p className="text-xs text-slate-500">Provide state fiscal and capacity metrics</p>
              </div>
              <button
                type="button"
                onClick={() => fillSample('Uttar Pradesh')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-slate-100 transition-colors"
                title="Populate realistic sample values for quick testing"
              >
                Auto-fill Sample
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Select Target State</span>
                <select
                  {...register('state')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink shadow-xs transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 hover:border-slate-300"
                >
                  {STATE_NAMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <span className="text-xs font-normal normal-case text-critical">{errors.state.message}</span>}
              </label>

              {fields.map((f) => (
                <label key={f.name} className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>{f.label}</span>
                    <span className="text-[10px] font-normal normal-case text-slate-400">({f.unit})</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder={f.placeholder}
                    {...register(f.name)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink shadow-xs transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 hover:border-slate-300"
                  />
                  {errors[f.name] && <span className="text-xs font-normal normal-case text-critical">{errors[f.name].message}</span>}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-card hover:bg-primaryLight hover:shadow-cardHover transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Running ML Inference...' : 'Generate Utilization Forecast'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Results & Explanation */}
        <div className="lg:col-span-6 space-y-5">
          {loading && <LoadingSpinner label="Executing XGBoost Regressor model..." />}

          {result && !loading && (
            <>
              {/* Executive Result Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-ink">Inference Forecast Output</h3>
                    <p className="text-xs text-slate-500">Model: {result.modelName}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      result.mode === 'api'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-amber-50 text-amber-800 ring-amber-600/20'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${result.mode === 'api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {result.mode === 'api' ? 'Live API Inference' : 'Demonstration Fallback'}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50/80 p-5 border border-slate-100">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Forecasted Fiscal Utilization
                    </span>
                    <p className="tabular mt-1 text-4xl font-extrabold text-ink">
                      {result.predictedUtilization}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Estimated end-of-year expenditure absorption
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Risk Classification
                    </span>
                    <RiskBadge level={result.risk} />
                  </div>
                </div>

                {result.note && (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 border border-amber-200/60">
                    {result.note}
                  </p>
                )}
              </div>

              {/* Input Parameters Summary */}
              {inputs && (
                <ChartCard title="Evaluated Parameter Profile" subtitle="Parameters supplied to regression pipeline">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(inputs).map(([k, v]) => (
                      <div key={k} className="flex flex-col rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">{k}</span>
                        <span className="font-bold text-ink mt-0.5">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}

              {/* Feature Importance Attribution */}
              {result.featureImportance && (
                <ChartCard
                  title="Feature Importance Ranking"
                  subtitle="Relative influence of input dimensions on the model prediction"
                >
                  <PlotlyChart
                    data={[
                      {
                        type: 'bar',
                        orientation: 'h',
                        x: result.featureImportance.map((f) => f.importance),
                        y: result.featureImportance.map((f) => f.feature),
                        marker: { color: '#0F2745' },
                      },
                    ]}
                    layout={{
                      margin: { l: 160, r: 20, t: 20, b: 30 },
                      xaxis: { title: 'Relative Importance' },
                    }}
                  />
                </ChartCard>
              )}
            </>
          )}

          {!loading && !result && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-secondary mx-auto mb-3">
                <BrainCircuit size={24} />
              </div>
              <h4 className="text-base font-bold text-ink">Ready for ML Inference</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Fill the parameters on the left or click "Auto-fill Sample" to simulate an XGBoost budget absorption prediction for any state.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History (demo dataset until the /predictions API contract is confirmed) */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">Recent Predictions</h3>
            <p className="text-xs text-slate-500">Latest utilization forecasts across states</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Demo data
          </span>
        </div>

        {demoPredictionHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No predictions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {demoPredictionHistory.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{p.state}</p>
                  <p className="text-xs text-slate-400">{p.date} · ID {p.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-bold text-ink">{p.utilization}%</span>
                  <RiskBadge level={p.risk} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

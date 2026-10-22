
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
import {
  predictBudgetUtilization,
  getPredictionServiceHealth,
} from '../services/predictionService';
import { STATE_NAMES, demoPredictionHistory } from '../data/mockData';

const schema = z.object({
  state: z.string().min(1, 'Select a state'),
  allocatedBudget: z.coerce.number().positive('Must be > 0'),
  previousUtilization: z.coerce.number().min(0).max(100, '0–100'),
  population: z.coerce.number().positive('Must be > 0'),
  diseaseBurden: z.coerce.number().min(0).max(100, '0–100'),
  infrastructureIndex: z.coerce.number().min(0).max(100, '0–100'),
});

export default function Predictions() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(null);
  const [serviceHealth, setServiceHealth] = useState('checking');
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => {
    getPredictionServiceHealth().then((h) =>
      setServiceHealth(h.available ? 'available' : 'unavailable')
    );
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
    setPredictionError('');
    setInputs(values);

    try {
      const res = await predictBudgetUtilization(values);
      setResult(res);
    } catch (error) {
      console.error('Prediction failed:', error);
      setPredictionError(
        error.response?.data?.detail ||
          error.message ||
          'Prediction failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: 'allocatedBudget',
      label: 'Allocated Budget',
      unit: '₹ Crores',
      placeholder: 'e.g. 24500',
    },
    {
      name: 'previousUtilization',
      label: 'Previous FY Utilization',
      unit: '0 – 100%',
      placeholder: 'e.g. 76',
    },
    {
      name: 'population',
      label: 'State Population',
      unit: 'Total Headcount',
      placeholder: 'e.g. 241000000',
    },
    {
      name: 'diseaseBurden',
      label: 'Disease Burden Index',
      unit: 'Score 0 – 100',
      placeholder: 'e.g. 78',
    },
    {
      name: 'infrastructureIndex',
      label: 'Infrastructure Index',
      unit: 'Score 0 – 100',
      placeholder: 'e.g. 62',
    },
  ];

  const isApiResult = result?.mode === 'api';
  const expenditure = Number(result?.predicted_expenditure);
  const hasExpenditure =
    result?.predicted_expenditure !== undefined &&
    result?.predicted_expenditure !== null &&
    Number.isFinite(expenditure);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ML Budget Prediction"
        description="Forecast expenditure using the connected budget prediction model."
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
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                serviceHealth === 'available'
                  ? 'bg-emerald-500'
                  : serviceHealth === 'unavailable'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`}
            />
            Prediction service:{' '}
            {serviceHealth === 'available'
              ? 'Available'
              : serviceHealth === 'unavailable'
                ? 'Offline'
                : 'Checking…'}
          </span>
        }
      />

      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
          i
        </div>
        <p className="leading-relaxed">
          Results from the connected API show predicted expenditure. They are
          not utilization percentages. Verify the model inputs and units before
          using forecasts for decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card"
          >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Inference Parameters
                </h3>
                <p className="text-xs text-slate-500">
                  Provide state fiscal and capacity metrics
                </p>
              </div>
              <button
                type="button"
                onClick={() => fillSample('Uttar Pradesh')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-secondary transition-colors hover:bg-slate-100"
              >
                Auto-fill Sample
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Select Target State</span>
                <select
                  {...register('state')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink shadow-xs transition-all hover:border-slate-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                >
                  {STATE_NAMES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <span className="text-xs font-normal normal-case text-critical">
                    {errors.state.message}
                  </span>
                )}
              </label>

              {fields.map((f) => (
                <label
                  key={f.name}
                  className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  <div className="flex items-center justify-between">
                    <span>{f.label}</span>
                    <span className="text-[10px] font-normal normal-case text-slate-400">
                      ({f.unit})
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder={f.placeholder}
                    {...register(f.name)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink shadow-xs transition-all hover:border-slate-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  {errors[f.name] && (
                    <span className="text-xs font-normal normal-case text-critical">
                      {errors[f.name].message}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-primaryLight hover:shadow-cardHover disabled:opacity-50"
            >
              <span>
                {loading ? 'Running Prediction…' : 'Generate Prediction'}
              </span>
            </button>
          </form>
        </div>

        <div className="space-y-5 lg:col-span-6">
          {loading && <LoadingSpinner label="Running Linear Regression model…" />}

          {!loading && predictionError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <p className="font-semibold">Prediction failed</p>
              <p className="mt-1">{predictionError}</p>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      Prediction Result
                    </h3>
                    <p className="text-xs text-slate-500">
                      Model: {result.model || result.modelName || 'Unknown'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      isApiResult
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-amber-50 text-amber-800 ring-amber-600/20'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isApiResult ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {isApiResult ? 'Live API Inference' : 'Demo Result'}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {hasExpenditure
                        ? 'Predicted Expenditure'
                        : 'Prediction Value'}
                    </span>
                    <p className="tabular mt-1 text-4xl font-extrabold text-ink">
                      {hasExpenditure
                        ? expenditure.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })
                        : Number.isFinite(Number(result.predictedUtilization))
                          ? `${Number(result.predictedUtilization).toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            })}%`
                          : 'No value returned'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {hasExpenditure
                        ? 'In the model’s original units; confirm the training data units.'
                        : 'This result does not contain a predicted expenditure value.'}
                    </p>
                    {result.prediction_id != null && (
                      <p className="mt-2 text-xs text-slate-500">
                        Prediction ID: {result.prediction_id}
                      </p>
                    )}
                  </div>

                  {result.risk && (
                    <div className="text-right">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Risk Classification
                      </span>
                      <RiskBadge level={result.risk} />
                    </div>
                  )}
                </div>

                {result.note && (
                  <p className="mt-4 rounded-lg border border-amber-200/60 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                    {result.note}
                  </p>
                )}
              </div>

              {inputs && (
                <ChartCard
                  title="Evaluated Parameter Profile"
                  subtitle="Values entered in the prediction form"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(inputs).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                      >
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {k}
                        </span>
                        <span className="mt-0.5 font-bold text-ink">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}

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

          {!loading && !result && !predictionError && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-secondary">
                <BrainCircuit size={24} />
              </div>
              <h4 className="text-base font-bold text-ink">
                Ready for Prediction
              </h4>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                Fill in the parameters or click Auto-fill Sample to test the
                connected prediction API.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">Recent Predictions</h3>
            <p className="text-xs text-slate-500">
              Latest forecasts from the demo dataset
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Demo data
          </span>
        </div>

        {demoPredictionHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No predictions yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {demoPredictionHistory.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{p.state}</p>
                  <p className="text-xs text-slate-400">
                    {p.date} · ID {p.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-bold text-ink">
                    {p.utilization}%
                  </span>
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


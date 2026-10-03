import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, BarChart3, BrainCircuit, FileSearch, Sparkles,
  ChevronRight, Shield, Database, Cpu, CheckCircle2, ArrowUpRight, Layers
} from 'lucide-react';
import {
  stateBudgetData, samplePrediction
} from '../data/mockData';

export default function LandingPage() {
  const [activeModule, setActiveModule] = useState(0);
  const [activePreview, setActivePreview] = useState('dashboard');

  const totalAllocated = stateBudgetData.reduce((a, s) => a + s.allocated, 0);
  const totalUtilized = stateBudgetData.reduce((a, s) => a + s.utilized, 0);
  const avgUtilization = Math.round((totalUtilized / totalAllocated) * 100);

  const capabilities = [
    {
      id: 'doc-chat',
      title: 'Government Healthcare Document Intelligence',
      badge: 'RAG Pipeline',
      icon: FileSearch,
      desc: 'Conversational retrieval-augmented intelligence over official MoHFW policy guidelines, NHM circulars, and financial frameworks with verifiable citations.',
      route: '/document-chat',
      actionText: 'Explore Document Intelligence',
      highlights: [
        'Semantic vector indexing of health policy circulars',
        'Direct citation linking with exact document and section numbers',
        'Grounding responses in verified administrative texts',
      ],
      sampleOutput: {
        query: 'What are the major challenges in budget utilization under NHM?',
        answer: 'Key challenges identified include procurement bottleneck cycles at state health societies, district-level manpower constraints, and delayed release of state-share funds.',
        source: 'National Health Mission MIS Review (demo) — Section 6',
      },
    },
    {
      id: 'analytics',
      title: 'Budget and Utilization Analytics',
      badge: 'Multi-Dimensional',
      icon: BarChart3,
      desc: 'Comparative tracking of sanctioned state allocations versus actual expenditure across financial years, healthcare sectors, and demographic profiles.',
      route: '/budget-analytics',
      actionText: 'Open Budget Analytics',
      highlights: [
        'Allocation vs. expenditure comparative state metrics',
        '5-year macro expenditure trajectory tracking',
        'Sub-sector breakdown across NHM, primary care, and infrastructure',
      ],
      sampleOutput: {
        stat1: '₹2,05,000 Cr',
        label1: 'FY 24-25 National Outlay',
        stat2: '73.5%',
        label2: 'Aggregate Utilization',
        stat3: '12 Demo States',
        label3: 'Comparative Monitoring',
      },
    },
    {
      id: 'prediction',
      title: 'ML Budget Utilization Prediction',
      badge: 'XGBoost Inference',
      icon: BrainCircuit,
      desc: 'Predictive machine learning models trained to forecast annual budget absorption rates based on historical utilization, state disease burden, and infrastructure indices.',
      route: '/predictions',
      actionText: 'Run Prediction Engine',
      highlights: [
        'Early fiscal warning for potential underspending',
        'Multi-factor modeling incorporating population and infrastructure',
        'Transparent confidence scoring and risk categorization',
      ],
      sampleOutput: {
        score: '78.4%',
        risk: 'Low Risk',
        model: 'XGBoost-Regressor-v1',
        feature: 'Key Driver: Historical 3-Yr Utilization Momentum',
      },
    },
    {
      id: 'recommendation',
      title: 'AI Budget Recommendation Engine',
      badge: 'LLM Guided',
      icon: Sparkles,
      desc: 'Structured, decision-support planning guidance proposing targeted reallocation shares across primary healthcare, infrastructure, and human resources.',
      route: '/recommendations',
      actionText: 'Generate Recommendations',
      highlights: [
        'Evidence-grounded allocation focus percentages',
        'Synthesizes local health burden indicators with central schemes',
        'Actionable checklist for district healthcare administrators',
      ],
      sampleOutput: {
        classification: 'Priority A: Rural Infrastructure',
        split: '40% Primary Care · 25% Infrastructure · 20% Manpower · 15% Diagnostics',
        status: 'Awaiting Official Verification',
      },
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Healthcare Documents & Budget Data',
      desc: 'Ingests state health allocation data, expenditure logs, demographic censuses, and official MoHFW PDF policy guidelines.',
      icon: Database,
      tag: 'Data Ingestion',
    },
    {
      step: '02',
      title: 'Intelligence & Analytics',
      desc: 'Normalizes fiscal records across financial years, generates comparative absorption curves, and indexes document embeddings.',
      icon: Layers,
      tag: 'Analytics Engine',
    },
    {
      step: '03',
      title: 'ML Predictive Forecasting',
      desc: 'Evaluates state-level infrastructure indices and disease burdens to forecast year-end utilization percentages and risk levels.',
      icon: Cpu,
      tag: 'ML Inference',
    },
    {
      step: '04',
      title: 'AI Decision Recommendations',
      desc: 'Synthesizes predictive risk with policy guidelines to recommend targeted allocation adjustments for review by officials.',
      icon: Sparkles,
      tag: 'Decision Support',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-ink antialiased selection:bg-secondary/15 selection:text-secondaryDark">
      {/* Tricolor Government Hairline Accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-orange-500 via-blue-600 to-emerald-500" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-md">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-ink">AI Sarthi</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-blue-500/20">
                  MoHFW
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Healthcare Budget Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#capabilities" className="hover:text-primary transition-colors">Capabilities</a>
            <a href="#workflow" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-primary transition-colors">Platform Preview</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primaryLight transition-all duration-150"
            >
              <span>Enter Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-16 sm:py-24 bg-grid">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 radial-glow" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* National Initiative Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                MoHFW Decision Support Platform · Prototype V1
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Smarter Healthcare Budgeting.{' '}
              <span className="bg-gradient-to-r from-primary via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Better-Informed Decisions.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-base text-slate-600 sm:text-lg sm:leading-relaxed">
              AI Sarthi brings healthcare budget intelligence, utilization analytics, predictive insights, and AI-assisted recommendations into one unified platform.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-card hover:bg-primaryLight hover:shadow-cardHover transition-all duration-200"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#capabilities"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-150"
              >
                <span>Explore Capabilities</span>
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Sub-notice */}
            <p className="mt-4 text-xs text-slate-500">
              Decision-support system for health administrators · Verified government data models
            </p>
          </div>

          {/* Real Telemetry Preview Snippet */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  National Budget Position Telemetry
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  FY 2024-25 Benchmark
                </span>
              </div>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
              >
                View Live Telemetry <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sanctioned Outlay</p>
                <p className="tabular mt-1 text-xl font-bold text-ink sm:text-2xl">₹2,05,000 Cr</p>
                <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">+8.1% vs FY 23-24</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actual Expenditure</p>
                <p className="tabular mt-1 text-xl font-bold text-ink sm:text-2xl">₹1,50,800 Cr</p>
                <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">Aggregated across states</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">National Absorption</p>
                <p className="tabular mt-1 text-xl font-bold text-ink sm:text-2xl">{avgUtilization}%</p>
                <p className="mt-0.5 text-[11px] text-amber-700 font-medium">Avg utilization rate</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">States Monitored</p>
                <p className="tabular mt-1 text-xl font-bold text-ink sm:text-2xl">12 States</p>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium">Complete data profiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT AI SARTHI */}
      <section id="about" className="border-b border-slate-200/80 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Public Health Fiscal Intelligence
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Bridging the Gap Between Health Policy Allocations and On-Ground Utilization
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                India's public healthcare ecosystem administers thousands of crores across complex centrally sponsored schemes like the National Health Mission (NHM). However, state-level absorption capacity varies widely due to procurement delays, infrastructural discrepancies, and fragmented guideline documents.
              </p>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                <strong>AI Sarthi</strong> provides health administrators with a centralized, data-driven cockpit. By uniting historical financial flows with RAG-powered document intelligence and predictive machine learning, the system empowers officials to anticipate bottlenecks and deploy healthcare capital with maximum impact.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-secondary">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Decision Support</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Augments human expertise without automating critical approval gates.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Grounded In Policy</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Every recommendation is traceable to official MoHFW circulars.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Pillars Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
              <h3 className="text-lg font-bold text-ink">Core Strategic Capabilities</h3>
              <p className="text-xs text-slate-500 mt-1">Key functional pillars engineered for administrative clarity</p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'Transparent Fiscal Tracking',
                    desc: 'Instant comparative visualization of sanctioned budgets vs reported expenditure across 12 major states.',
                    color: 'text-primary',
                  },
                  {
                    title: 'RAG Document Retrieval',
                    desc: 'Query complex health guidelines and circulars in natural language with page-level citations.',
                    color: 'text-secondary',
                  },
                  {
                    title: 'Predictive Utilization Modeling',
                    desc: 'XGBoost inference models identifying high-risk underspending trends well before fiscal year-end.',
                    color: 'text-accent',
                  },
                  {
                    title: 'Actionable Allocation Focus',
                    desc: 'AI-generated planning recommendations aligned with state disease burden and infrastructure capacity.',
                    color: 'text-emerald-700',
                  },
                ].map((pillar, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow-xs">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className={`text-sm font-semibold ${pillar.color}`}>{pillar.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="capabilities" className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Unified Modular Architecture
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Engineered for Public Health Decision-Makers
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600 sm:text-base">
              Four specialized modules seamlessly integrated to support the entire lifecycle of healthcare budget planning, monitoring, and optimization.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              const isSelected = activeModule === index;
              return (
                <button
                  key={cap.id}
                  onClick={() => setActiveModule(index)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-card'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{cap.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Module Showcase Card */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:p-8">
            {(() => {
              const current = capabilities[activeModule];
              const Icon = current.icon;
              return (
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                        <Icon size={20} />
                      </div>
                      <div>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                          {current.badge}
                        </span>
                        <h3 className="text-xl font-bold text-ink sm:text-2xl mt-0.5">{current.title}</h3>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{current.desc}</p>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Key Capabilities:
                      </h4>
                      <ul className="space-y-2">
                        {current.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={current.route}
                        className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-secondaryDark transition-colors"
                      >
                        <span>{current.actionText}</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* Interactive Sample Output Preview */}
                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Interactive Live Preview
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-600/20">
                        Module Output
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {activeModule === 0 && (
                        <div className="space-y-2 text-xs">
                          <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                            <p className="font-semibold text-slate-500">Query:</p>
                            <p className="mt-1 text-slate-800 font-medium">"{current.sampleOutput.query}"</p>
                          </div>
                          <div className="rounded-lg bg-blue-50/80 p-3 border border-blue-100 text-blue-900">
                            <p className="font-semibold text-secondary">RAG Answer:</p>
                            <p className="mt-1 leading-relaxed">{current.sampleOutput.answer}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200 text-slate-500 text-[11px]">
                            <b>Citation Source:</b> {current.sampleOutput.source}
                          </div>
                        </div>
                      )}

                      {activeModule === 1 && (
                        <div className="grid grid-cols-1 gap-2.5 text-xs">
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <p className="text-slate-400 font-medium">{current.sampleOutput.label1}</p>
                            <p className="text-lg font-bold text-ink mt-0.5">{current.sampleOutput.stat1}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <p className="text-slate-400 font-medium">{current.sampleOutput.label2}</p>
                            <p className="text-lg font-bold text-ink mt-0.5">{current.sampleOutput.stat2}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <p className="text-slate-400 font-medium">{current.sampleOutput.label3}</p>
                            <p className="text-lg font-bold text-ink mt-0.5">{current.sampleOutput.stat3}</p>
                          </div>
                        </div>
                      )}

                      {activeModule === 2 && (
                        <div className="space-y-2.5 text-xs">
                          <div className="rounded-lg bg-white p-4 border border-slate-200 text-center">
                            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Predicted Utilization</p>
                            <p className="text-3xl font-extrabold text-secondary mt-1">{current.sampleOutput.score}</p>
                            <span className="inline-block mt-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                              {current.sampleOutput.risk}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] text-slate-600">
                            <p><b>Model Engine:</b> {current.sampleOutput.model}</p>
                            <p className="text-slate-500 mt-0.5">{current.sampleOutput.feature}</p>
                          </div>
                        </div>
                      )}

                      {activeModule === 3 && (
                        <div className="space-y-2.5 text-xs">
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                              {current.sampleOutput.classification}
                            </span>
                            <p className="text-slate-700 font-medium mt-2 leading-relaxed">
                              Focus: {current.sampleOutput.split}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-amber-800 text-[11px]">
                            <b>Governance Notice:</b> {current.sampleOutput.status}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / WORKFLOW */}
      <section id="workflow" className="border-b border-slate-200/80 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              End-to-End Workflow
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              From Raw Expenditure Data to Strategic Decisions
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600 sm:text-base">
              A transparent, four-phase information pipeline connecting unstructured administrative circulars with quantifiable budgetary forecasting.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((ws, i) => {
              const Icon = ws.icon;
              return (
                <div
                  key={ws.step}
                  className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-cardHover"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-2xl font-black text-slate-300">{ws.step}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {ws.tag}
                      </span>
                    </div>

                    <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                      <Icon size={20} />
                    </div>

                    <h3 className="mt-3 text-base font-bold text-ink">{ws.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{ws.desc}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium text-secondary">
                    <span>Phase {i + 1} Pipeline</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATFORM PREVIEW */}
      <section id="preview" className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Interactive Exploration
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Explore The Actual Platform Modules
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Inspect key application screens built with realistic state health data models, interactive Plotly visualizations, and verifiable outputs.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'dashboard', label: 'Overview Dashboard' },
                { id: 'state', label: 'State Drilldown' },
                { id: 'predictions', label: 'ML Forecast' },
                { id: 'chat', label: 'Document Chat' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePreview(tab.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    activePreview === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-card">
            {activePreview === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-ink">National Healthcare Budget Cockpit</h4>
                    <p className="text-xs text-slate-500">Aggregation across all 12 demo states for FY 2024-25</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                  >
                    Open Live Dashboard <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Sanctioned</p>
                    <p className="text-lg font-bold text-ink mt-0.5">₹{totalAllocated.toLocaleString('en-IN')} Cr</p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Expenditure</p>
                    <p className="text-lg font-bold text-ink mt-0.5">₹{totalUtilized.toLocaleString('en-IN')} Cr</p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Absorption Rate</p>
                    <p className="text-lg font-bold text-ink mt-0.5">{avgUtilization}%</p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">High Risk States</p>
                    <p className="text-lg font-bold text-critical mt-0.5">3 States (&lt;68%)</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sample State Records</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead className="border-b border-slate-100 text-slate-500 font-semibold">
                        <tr>
                          <th className="pb-2">State</th>
                          <th className="pb-2">Allocated</th>
                          <th className="pb-2">Utilized</th>
                          <th className="pb-2">Utilization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {stateBudgetData.slice(0, 4).map((s) => (
                          <tr key={s.state} className="hover:bg-slate-50">
                            <td className="py-2 font-medium text-ink">{s.state}</td>
                            <td className="py-2">₹{s.allocated.toLocaleString('en-IN')} Cr</td>
                            <td className="py-2">₹{s.utilized.toLocaleString('en-IN')} Cr</td>
                            <td className="py-2 font-semibold text-secondary">
                              {Math.round((s.utilized / s.allocated) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activePreview === 'state' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-ink">State Deep-Dive Analysis</h4>
                    <p className="text-xs text-slate-500">Demographic, disease burden, and health capacity index</p>
                  </div>
                  <Link
                    to="/state-analysis?state=Uttar%20Pradesh"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                  >
                    Open State Analysis <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white p-4 border border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Featured State</span>
                    <p className="text-lg font-bold text-ink mt-1">Uttar Pradesh</p>
                    <p className="text-xs text-slate-500 mt-1">Population: 24.1 Cr · Burden: 78/100</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 border border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Infrastructure Index</span>
                    <p className="text-lg font-bold text-emerald-700 mt-1">62 / 100</p>
                    <p className="text-xs text-slate-500 mt-1">Hospital beds: 58 · Facilities: 65</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 border border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Unspent Balance</span>
                    <p className="text-lg font-bold text-accent mt-1">₹4,900 Cr</p>
                    <p className="text-xs text-slate-500 mt-1">Available for reallocation review</p>
                  </div>
                </div>
              </div>
            )}

            {activePreview === 'predictions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-ink">Machine Learning Predictive Inference</h4>
                    <p className="text-xs text-slate-500">XGBoost regression modeling of fiscal utilization</p>
                  </div>
                  <Link
                    to="/predictions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                  >
                    Open Prediction Tool <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-secondary">
                        Model: {samplePrediction.modelName}
                      </span>
                      <h5 className="text-xl font-bold text-ink mt-2">
                        Predicted Utilization: {samplePrediction.predictedUtilization}%
                      </h5>
                      <p className="text-xs text-slate-500 mt-1">
                        Risk Classification: <b>{samplePrediction.risk}</b>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        Status: Evaluated
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreview === 'chat' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-ink">RAG Document Intelligence</h4>
                    <p className="text-xs text-slate-500">Grounded conversational assistant querying MoHFW documents</p>
                  </div>
                  <Link
                    to="/document-chat"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                  >
                    Open Document Chat <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200/80 space-y-3">
                  <div className="flex justify-end">
                    <div className="rounded-2xl bg-secondary px-3.5 py-2 text-xs text-white max-w-sm">
                      Explain the National Health Mission expenditure trends.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-800 max-w-md space-y-2">
                      <p>
                        National Health Mission expenditure has grown steadily from roughly ₹54,000 crore in 2021-22 to about ₹61,200 crore in 2024-25, with utilization tracking between 72% and 80%.
                      </p>
                      <div className="rounded border border-slate-200 bg-white p-2 text-[11px] text-slate-500">
                        <b>Citation:</b> NHM Financial Progress Report — Annexure B
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative overflow-hidden bg-primary py-16 sm:py-20 text-white">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200 ring-1 ring-white/20">
            Empower Healthcare Decision Making
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to Explore AI Sarthi?
          </h2>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-blue-100 leading-relaxed">
            Gain immediate insight into national health allocations, execute predictive machine learning forecasts, and review AI-assisted planning recommendations.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-lg hover:bg-blue-50 transition-all duration-150"
            >
              <span>Enter Overview Dashboard</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/state-analysis"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all duration-150"
            >
              <span>Explore State Analysis</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Activity size={18} />
              </div>
              <span className="text-sm font-bold text-ink">AI Sarthi Platform</span>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-600 font-medium">
              <Link to="/dashboard" className="hover:text-primary">Overview Dashboard</Link>
              <Link to="/state-analysis" className="hover:text-primary">State Analysis</Link>
              <Link to="/budget-analytics" className="hover:text-primary">Budget Analytics</Link>
              <Link to="/predictions" className="hover:text-primary">ML Predictions</Link>
              <Link to="/recommendations" className="hover:text-primary">AI Recommendations</Link>
              <Link to="/document-chat" className="hover:text-primary">Document Chat</Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© 2026 AI Sarthi · Ministry of Health and Family Welfare (MoHFW) Prototype</p>
            <p className="text-center sm:text-right">
              Designed for public healthcare budget intelligence and administrative decision support.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

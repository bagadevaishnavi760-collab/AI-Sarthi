// ---------------------------------------------------------------------------
// AI Sarthi — Mock Demonstration Data
// ---------------------------------------------------------------------------
// IMPORTANT: All values in this file are illustrative demonstration data
// created for the V1 prototype. They are NOT verified government statistics.
// ---------------------------------------------------------------------------

export const FINANCIAL_YEARS = ['2021-22', '2022-23', '2023-24', '2024-25'];

export const HEALTHCARE_SECTORS = [
  'Primary Healthcare',
  'Secondary & Tertiary Care',
  'National Health Mission',
  'Disease Control Programs',
  'Infrastructure Development',
  'Medical Education & Training',
];

// Demo state-wise healthcare financial data (values in ₹ Crores)
export const stateBudgetData = [
  { state: 'Uttar Pradesh', allocated: 24500, utilized: 19600, population: 241000000, diseaseBurden: 78, infrastructureIndex: 62 },
  { state: 'Maharashtra', allocated: 22100, utilized: 18900, population: 126000000, diseaseBurden: 64, infrastructureIndex: 74 },
  { state: 'Bihar', allocated: 15800, utilized: 10200, population: 128000000, diseaseBurden: 82, infrastructureIndex: 48 },
  { state: 'West Bengal', allocated: 14300, utilized: 11500, population: 97000000, diseaseBurden: 68, infrastructureIndex: 60 },
  { state: 'Tamil Nadu', allocated: 16200, utilized: 14200, population: 79000000, diseaseBurden: 55, infrastructureIndex: 79 },
  { state: 'Karnataka', allocated: 14500, utilized: 11800, population: 67000000, diseaseBurden: 58, infrastructureIndex: 72 },
  { state: 'Gujarat', allocated: 13200, utilized: 10900, population: 70000000, diseaseBurden: 61, infrastructureIndex: 70 },
  { state: 'Rajasthan', allocated: 12100, utilized: 8300, population: 81000000, diseaseBurden: 74, infrastructureIndex: 55 },
  { state: 'Madhya Pradesh', allocated: 11800, utilized: 7600, population: 87000000, diseaseBurden: 76, infrastructureIndex: 52 },
  { state: 'Kerala', allocated: 8900, utilized: 8100, population: 35600000, diseaseBurden: 49, infrastructureIndex: 83 },
  { state: 'Odisha', allocated: 9400, utilized: 6800, population: 46000000, diseaseBurden: 71, infrastructureIndex: 57 },
  { state: 'Punjab', allocated: 7200, utilized: 5900, population: 30000000, diseaseBurden: 63, infrastructureIndex: 66 },
];

// Historical yearly budget trends (₹ Crores, aggregated across states)
export const yearlyTrends = [
  { year: '2021-22', allocated: 158000, utilized: 114000 },
  { year: '2022-23', allocated: 171500, utilized: 128500 },
  { year: '2023-24', allocated: 189600, utilized: 141200 },
  { year: '2024-25', allocated: 205000, utilized: 150800 },
];

// Sector-wise allocation of the aggregate national healthcare budget
export const sectorAllocation = [
  { sector: 'National Health Mission', value: 61200 },
  { sector: 'Secondary & Tertiary Care', value: 48500 },
  { sector: 'Primary Healthcare', value: 36800 },
  { sector: 'Infrastructure Development', value: 27400 },
  { sector: 'Disease Control Programs', value: 19800 },
  { sector: 'Medical Education & Training', value: 11300 },
];

// Per-state historical trends for State Analysis page
export const stateHistory = {
  'Uttar Pradesh': [
    { year: '2021-22', allocated: 19800, utilized: 14200 },
    { year: '2022-23', allocated: 21400, utilized: 16500 },
    { year: '2023-24', allocated: 23100, utilized: 17800 },
    { year: '2024-25', allocated: 24500, utilized: 19600 },
  ],
  'Maharashtra': [
    { year: '2021-22', allocated: 18500, utilized: 14700 },
    { year: '2022-23', allocated: 19900, utilized: 16800 },
    { year: '2023-24', allocated: 21000, utilized: 18200 },
    { year: '2024-25', allocated: 22100, utilized: 18900 },
  ],
  'Bihar': [
    { year: '2021-22', allocated: 12400, utilized: 6800 },
    { year: '2022-23', allocated: 13600, utilized: 8200 },
    { year: '2023-24', allocated: 14800, utilized: 9100 },
    { year: '2024-25', allocated: 15800, utilized: 10200 },
  ],
  'West Bengal': [
    { year: '2021-22', allocated: 11800, utilized: 8600 },
    { year: '2022-23', allocated: 12600, utilized: 9700 },
    { year: '2023-24', allocated: 13500, utilized: 10600 },
    { year: '2024-25', allocated: 14300, utilized: 11500 },
  ],
  'Tamil Nadu': [
    { year: '2021-22', allocated: 13200, utilized: 10900 },
    { year: '2022-23', allocated: 14100, utilized: 12100 },
    { year: '2023-24', allocated: 15200, utilized: 13200 },
    { year: '2024-25', allocated: 16200, utilized: 14200 },
  ],
  'Karnataka': [
    { year: '2021-22', allocated: 11900, utilized: 9000 },
    { year: '2022-23', allocated: 12700, utilized: 10100 },
    { year: '2023-24', allocated: 13600, utilized: 11000 },
    { year: '2024-25', allocated: 14500, utilized: 11800 },
  ],
  'Gujarat': [
    { year: '2021-22', allocated: 10900, utilized: 8600 },
    { year: '2022-23', allocated: 11600, utilized: 9400 },
    { year: '2023-24', allocated: 12400, utilized: 10100 },
    { year: '2024-25', allocated: 13200, utilized: 10900 },
  ],
  'Rajasthan': [
    { year: '2021-22', allocated: 9800, utilized: 6100 },
    { year: '2022-23', allocated: 10500, utilized: 6900 },
    { year: '2023-24', allocated: 11300, utilized: 7400 },
    { year: '2024-25', allocated: 12100, utilized: 8300 },
  ],
  'Madhya Pradesh': [
    { year: '2021-22', allocated: 9500, utilized: 5600 },
    { year: '2022-23', allocated: 10200, utilized: 6300 },
    { year: '2023-24', allocated: 11000, utilized: 6900 },
    { year: '2024-25', allocated: 11800, utilized: 7600 },
  ],
  'Kerala': [
    { year: '2021-22', allocated: 7400, utilized: 6400 },
    { year: '2022-23', allocated: 7900, utilized: 7000 },
    { year: '2023-24', allocated: 8400, utilized: 7500 },
    { year: '2024-25', allocated: 8900, utilized: 8100 },
  ],
  'Odisha': [
    { year: '2021-22', allocated: 7600, utilized: 5000 },
    { year: '2022-23', allocated: 8200, utilized: 5600 },
    { year: '2023-24', allocated: 8800, utilized: 6200 },
    { year: '2024-25', allocated: 9400, utilized: 6800 },
  ],
  'Punjab': [
    { year: '2021-22', allocated: 6100, utilized: 4600 },
    { year: '2022-23', allocated: 6500, utilized: 5100 },
    { year: '2023-24', allocated: 6900, utilized: 5500 },
    { year: '2024-25', allocated: 7200, utilized: 5900 },
  ],
};

// Infrastructure indicator breakdown (0–100 scores) per state
export const infrastructureIndicators = {
  'Uttar Pradesh': { beds: 58, doctors: 61, diagnostics: 64, facilities: 65 },
  'Maharashtra': { beds: 75, doctors: 73, diagnostics: 72, facilities: 76 },
  'Bihar': { beds: 45, doctors: 47, diagnostics: 50, facilities: 50 },
  'West Bengal': { beds: 60, doctors: 62, diagnostics: 58, facilities: 60 },
  'Tamil Nadu': { beds: 80, doctors: 78, diagnostics: 77, facilities: 81 },
  'Karnataka': { beds: 73, doctors: 71, diagnostics: 70, facilities: 74 },
  'Gujarat': { beds: 71, doctors: 69, diagnostics: 68, facilities: 72 },
  'Rajasthan': { beds: 55, doctors: 54, diagnostics: 56, facilities: 55 },
  'Madhya Pradesh': { beds: 52, doctors: 51, diagnostics: 53, facilities: 52 },
  'Kerala': { beds: 84, doctors: 82, diagnostics: 81, facilities: 85 },
  'Odisha': { beds: 56, doctors: 55, diagnostics: 58, facilities: 59 },
  'Punjab': { beds: 66, doctors: 67, diagnostics: 64, facilities: 67 },
};

// Example ML prediction (used only in clearly labelled demo mode)
export const samplePrediction = {
  predictedUtilization: 81.5,
  risk: 'Medium',
  modelName: 'XGBoost Utilization Classifier v1 (demo)',
  status: 'success',
  mode: 'mock-demo',
  featureImportance: [
    { feature: 'Previous Utilization', importance: 0.34 },
    { feature: 'Infrastructure Indicators', importance: 0.26 },
    { feature: 'Disease Burden', importance: 0.18 },
    { feature: 'Population', importance: 0.12 },
    { feature: 'Allocated Budget', importance: 0.10 },
  ],
};

// Demo-only prediction history for the history panel (clearly labelled; not real API data)
export const demoPredictionHistory = [
  { id: 'demo-001', state: 'Uttar Pradesh', date: '2026-09-28', utilization: 81.5, risk: 'Medium', source: 'demo' },
  { id: 'demo-002', state: 'Bihar', date: '2026-09-24', utilization: 64.8, risk: 'High', source: 'demo' },
  { id: 'demo-003', state: 'Kerala', date: '2026-09-21', utilization: 91.2, risk: 'Low', source: 'demo' },
  { id: 'demo-004', state: 'Tamil Nadu', date: '2026-09-15', utilization: 87.7, risk: 'Low', source: 'demo' },
  { id: 'demo-005', state: 'Madhya Pradesh', date: '2026-09-11', utilization: 66.1, risk: 'High', source: 'demo' },
];

// Example AI-generated recommendation (used only in explicit demo mode)
export const sampleRecommendation = {
  priorityClassification: 'Infrastructure-First Intervention',
  executiveSummary:
    'Uttar Pradesh demonstrates a moderate utilization rate with a widening gap between allocation and expenditure in primary healthcare. Targeted investment in infrastructure and manpower is advised to absorb the allocated funds effectively.',
  recommendedActions: [
    'Fast-track completion of pending primary health centre upgrades across high-burden districts.',
    'Deploy additional community health officers in aspirational districts.',
    'Strengthen procurement monitoring to reduce fund lapse at district level.',
    'Expand mobile medical units in low-connectivity blocks.',
  ],
  suggestedAllocationFocus: [
    { category: 'Infrastructure', percentage: 45 },
    { category: 'Manpower', percentage: 35 },
    { category: 'Prevention', percentage: 20 },
  ],
  supportingReasoning:
    'District-level audit flags (demo) indicate under-utilization driven by infrastructure gaps rather than low demand. Disease burden indices remain high in eastern districts, suggesting prevention spending will see uptake if delivery capacity improves.',
  evidenceFromDocuments: [
    {
      document: 'National Health Mission Framework for Implementation (demo)',
      section: 'Section 4.2 — Infrastructure Support',
      snippet: 'Funds for infrastructure upgrades directly correlate with improved utilization in aspirational districts.',
    },
    {
      document: 'Rural Health Statistics 2023-24 (demo)',
      section: 'Table 3.1 — Sub-Centre and PHC Status',
      snippet: 'A significant share of sub-centres still lack dedicated infrastructure, limiting service delivery.',
    },
  ],
  assumptionsAndLimitations: [
    'This output is AI-generated decision support and requires verification by authorized officials.',
    'Figures shown are demonstration values, not verified government statistics.',
    'Local ground conditions may differ from aggregated indicators.',
  ],
};

// Suggested chat questions for the RAG chatbot
export const suggestedQuestions = [
  'What is the healthcare budget allocation?',
  'What are the major challenges in budget utilization?',
  'Explain the National Health Mission expenditure trends.',
  'What recommendations are available for improving healthcare expenditure?',
];

// Mock chat responses keyed by demo keywords
export const sampleChatResponses = [
  {
    keywords: ['budget allocation', 'allocation'],
    answer:
      'Under the 2024-25 demo allocation, the total healthcare budget is approximately ₹2,05,000 crore, distributed across National Health Mission, secondary & tertiary care, primary healthcare, infrastructure development, disease control programs, and medical education. Demonstration data only.',
    sources: [
      { document: 'Union Budget 2024-25 Health Sector Note (demo)', section: 'p. 12', snippet: 'Total health sector outlay estimated at ₹2.05 lakh crore...' },
    ],
  },
  {
    keywords: ['challenges', 'utilization'],
    answer:
      'Key demo challenges in budget utilization include delayed procurement cycles, shortage of skilled manpower at district level, under-developed infrastructure in aspirational districts, and weak district-level financial monitoring.',
    sources: [
      { document: 'National Health Mission MIS Review (demo)', section: 'p. 7', snippet: 'Utilization delays are concentrated in infrastructure and procurement heads...' },
    ],
  },
  {
    keywords: ['national health mission', 'nhm', 'expenditure'],
    answer:
      'National Health Mission expenditure (demo) has grown steadily from roughly ₹54,000 crore in 2021-22 to about ₹61,200 crore in 2024-25, with utilization tracking between 72% and 80% across the period.',
    sources: [
      { document: 'NHM Financial Progress Report (demo)', section: 'Annexure B', snippet: 'NHM releases and utilization trend, FY 2021-22 to 2024-25...' },
    ],
  },
  {
    keywords: ['recommendations', 'improving'],
    answer:
      'Demo recommendations to improve healthcare expenditure include: strengthening district procurement capacity, fast-tracking infrastructure completion, performance-linked fund release, and expanding preventive care programs with clear monitoring indicators.',
    sources: [
      { document: 'MoHFW Reform Agenda (demo)', section: 'Section 6', snippet: 'Performance-linked release of NHM funds can improve absorption...' },
    ],
  },
];

export const fallbackChatResponse = {
  answer:
    'This is a demonstration-mode answer. In the full system, this question would be answered by the RAG pipeline (Llama 3.2 + LangChain + FAISS) over official MoHFW documents.',
  sources: [
    { document: 'Demo Knowledge Base', section: 'N/A', snippet: 'No matching demo document section configured for this query.' },
  ],
};

// Reports listing (demo generated reports)
export const sampleReports = [
  { id: 1, title: 'National Budget Performance FY 2024-25', state: 'All States', type: 'Budget Performance Report', date: '2026-09-15', status: 'Generated' },
  { id: 2, title: 'Uttar Pradesh State Analysis', state: 'Uttar Pradesh', type: 'State Analysis Report', date: '2026-09-10', status: 'Generated' },
  { id: 3, title: 'ML Utilization Prediction — Bihar', state: 'Bihar', type: 'ML Prediction Report', date: '2026-09-05', status: 'Generated' },
  { id: 4, title: 'AI Recommendation — Maharashtra', state: 'Maharashtra', type: 'AI Recommendation Report', date: '2026-08-28', status: 'Generated' },
  { id: 5, title: 'Rajasthan Budget Performance FY 2023-24', state: 'Rajasthan', type: 'Budget Performance Report', date: '2026-08-20', status: 'Draft' },
];

// Helpers ----------------------------------------------------------------

export function getStateData(stateName) {
  return stateBudgetData.find((s) => s.state === stateName) || null;
}

export function utilizationPercent(state) {
  return state ? Math.round((state.utilized / state.allocated) * 100) : 0;
}

export function riskLevel(state) {
  const u = utilizationPercent(state);
  if (u >= 78) return 'Low';
  if (u >= 68) return 'Medium';
  return 'High';
}

export const STATE_NAMES = stateBudgetData.map((s) => s.state);

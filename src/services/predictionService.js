import api from './api';
import { samplePrediction } from '../data/mockData';

// GET /health — reports prediction service availability only.
export async function getPredictionServiceHealth() {
  try {
    const res = await api.get('/health', { timeout: 5000 });
    return { available: true, details: res.data };
  } catch {
    return { available: false, details: null };
  }
}

// POST /predict — the ML backend endpoint is provisional.
// Falls back to a clearly labelled demo-mode prediction shell when offline.
export async function predictBudgetUtilization(payload) {
  try {
    const res = await api.post('/predict', payload);
    return { ...res.data, mode: 'api' };
  } catch {
    // Demo mode: we deliberately do NOT fake a numeric prediction here.
    // We return a marked placeholder so the UI can show "demo mode".
    return {
      predictedUtilization: samplePrediction.predictedUtilization,
      risk: samplePrediction.risk,
      modelName: samplePrediction.modelName,
      featureImportance: samplePrediction.featureImportance,
      status: 'success',
      mode: 'mock-demo',
      note: 'DEMONSTRATION MODE: sample prediction shown because the ML API is unavailable. No real model inference was performed.',
    };
  }
}

import api from './api';

export async function getPredictionServiceHealth() {
  try {
    const res = await api.get('/health', { timeout: 5000 });
    return { available: true, details: res.data };
  } catch {
    return { available: false, details: null };
  }
}

export async function predictBudgetUtilization(payload) {
  // Map the current UI form to the actual FastAPI request schema.
  const request = {
    state: payload.state,
    year_numeric: new Date().getFullYear(),
    central_release: Number(payload.allocatedBudget),
    previous_year_expenditure:
      Number(payload.allocatedBudget) *
      Number(payload.previousUtilization) / 100,
    previous_year_central_release: Number(payload.allocatedBudget),
  };

  const res = await api.post('/predict', request);

  // Preserve the backend's actual response fields.
  return {
    ...res.data,
    mode: 'api',
  };
}
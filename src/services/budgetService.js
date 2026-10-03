import api from './api';
import { stateBudgetData, stateHistory, sectorAllocation, yearlyTrends } from '../data/mockData';

// NOTE: These service functions try the real FastAPI backend first and fall
// back to clearly-labelled mock demonstration data when the backend is
// unreachable. UI components never read mockData directly for budget figures.

export async function getDashboardData() {
  try {
    const res = await api.get('/api/dashboard');
    return { ...res.data, source: 'api' };
  } catch {
    return {
      states: stateBudgetData,
      yearlyTrends,
      sectorAllocation,
      source: 'mock-demo',
    };
  }
}

export async function getStates() {
  try {
    const res = await api.get('/api/states');
    return { states: res.data, source: 'api' };
  } catch {
    return { states: stateBudgetData, source: 'mock-demo' };
  }
}

export async function getBudgetByState(stateName) {
  try {
    const res = await api.get(`/api/budget/${encodeURIComponent(stateName)}`);
    return { data: res.data, source: 'api' };
  } catch {
    const state = stateBudgetData.find((s) => s.state === stateName) || null;
    return {
      data: state
        ? { ...state, history: stateHistory[stateName] || [] }
        : null,
      source: 'mock-demo',
    };
  }
}

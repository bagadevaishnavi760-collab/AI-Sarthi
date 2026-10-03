import api from './api';
import { sampleRecommendation } from '../data/mockData';

// POST /api/recommend — AI recommendation engine endpoint (provisional).
export async function generateRecommendation(payload) {
  try {
    const res = await api.post('/api/recommend', payload);
    return { ...res.data, mode: 'api' };
  } catch {
    return {
      ...sampleRecommendation,
      mode: 'mock-demo',
      note: 'DEMONSTRATION MODE: sample recommendation shown because the recommendation API is unavailable.',
    };
  }
}

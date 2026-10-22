import api from './api';

export async function getRecommendationOptions() {
  const res = await api.get('/api/recommend/options');
  return res.data;
}

export async function generateRecommendation(payload) {
  const res = await api.post('/api/recommend', payload, { timeout: 190000 });
  return res.data;
}

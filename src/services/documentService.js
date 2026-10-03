import api from './api';
import { sampleChatResponses, fallbackChatResponse } from '../data/mockData';

// POST /api/chat — RAG document intelligence endpoint (provisional).
export async function askDocumentQuestion(question) {
  try {
    const res = await api.post('/api/chat', { question });
    return { answer: res.data.answer, sources: res.data.sources || [], mode: 'api' };
  } catch {
    const q = question.toLowerCase();
    const match = sampleChatResponses.find((r) =>
      r.keywords.some((k) => q.includes(k)),
    );
    const hit = match || fallbackChatResponse;
    return { answer: hit.answer, sources: hit.sources, mode: 'mock-demo' };
  }
}

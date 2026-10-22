import api from './api';

export async function askDocumentQuestion(question, sessionId) {
  const res = await api.post('/api/chat', { question, session_id: sessionId }, { timeout: 180000 });
  return res.data;
}

export async function getIndexedDocuments() {
  const res = await api.get('/api/documents');
  return res.data.documents;
}

export async function getRagHealth() {
  const res = await api.get('/api/rag/health');
  return res.data;
}

import { useEffect, useState } from 'react';
import { RefreshCw, Send, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  askDocumentQuestion,
  getIndexedDocuments,
  getRagHealth,
} from '../services/documentService';
import { suggestedQuestions } from '../data/mockData';

const COMPONENT_LABELS = {
  python_dependencies: 'Python dependencies',
  ollama: 'Ollama',
  llm_model: 'LLM model',
  embedding_model: 'Embedding model',
  faiss_index: 'FAISS index',
};

const formatNumber = (value) => Number(value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatRecords = (records) => JSON.stringify(
  records,
  (_key, value) => typeof value === 'number' ? formatNumber(value) : value,
  2,
);

export default function DocumentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState('');
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState('');

  const refreshStatus = async () => {
    setHealthLoading(true);
    setDocumentsLoading(true);
    setHealthError('');
    setDocumentsError('');
    await Promise.all([
      getIndexedDocuments()
        .then(setDocuments)
        .catch((error) => setDocumentsError(error.message))
        .finally(() => setDocumentsLoading(false)),
      getRagHealth()
        .then(setHealth)
        .catch((error) => setHealthError(error.message))
        .finally(() => setHealthLoading(false)),
    ]);
  };

  useEffect(() => {
    getIndexedDocuments()
      .then(setDocuments)
      .catch((error) => setDocumentsError(error.message))
      .finally(() => setDocumentsLoading(false));
    getRagHealth()
      .then(setHealth)
      .catch((error) => setHealthError(error.message))
      .finally(() => setHealthLoading(false));
  }, []);

  const send = async (question) => {
    if (loading) return;
    const text = (question ?? input).trim();
    if (!text) return;
    setMessages((items) => [...items, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const response = await askDocumentQuestion(text, sessionId);
      setSessionId(response.session_id);
      setMessages((items) => [...items, { role: 'ai', ...response }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: 'ai',
          answer: `Document Intelligence is unavailable: ${error.message}`,
          sources: [],
          data_sources: [],
          limitations: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId(null);
  };
  const ragReady = Boolean(health?.ready);
  const componentStatuses = health?.components ?? {};
  const resultLabels = {
    structured_data: 'Structured dataset result',
    pdf_rag: 'PDF document result',
    combined: 'Combined PDF and structured-data result',
    insufficient_evidence: 'No matching evidence',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Document Intelligence"
        description="Conversational question-answering over official MoHFW circulars, National Health Mission guidelines, and expenditure notes."
        breadcrumb="AI & Intelligence / Document Chat"
        badge={
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
            ragReady
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-amber-50 text-amber-800 ring-amber-600/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ragReady ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            {healthError ? 'RAG status unavailable' : ragReady ? 'RAG Pipeline Ready' : 'RAG Pipeline Not Ready'}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Indexed Documents
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                health?.index_available
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 ring-slate-400/20'
              }`}>
                {health?.index_available
                  ? `FAISS · ${health.indexed_documents} documents · ${health.indexed_chunks} chunks`
                  : 'No indexed vector store'}
              </span>
              <button
                type="button"
                onClick={refreshStatus}
                disabled={healthLoading || documentsLoading}
                className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold text-secondary hover:bg-blue-50 disabled:opacity-50"
                aria-label="Refresh document intelligence status"
              >
                <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            {health && (
              <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-600">
                {Object.entries(componentStatuses).map(([key, component]) => (
                  <p key={key}>
                    <strong>{COMPONENT_LABELS[key] ?? key}:</strong>{' '}
                    {component.status}
                    {key === 'llm_model' && component.name ? ` (${component.name})` : ''}
                    {key === 'llm_model'
                      ? ` · inference ${component.inference_available ? 'ready' : 'unavailable'}`
                      : ''}
                    {key === 'embedding_model' && component.name ? ` (${component.name})` : ''}
                    {key === 'faiss_index'
                      ? ` · ${component.document_count} documents, ${component.chunk_count} chunks`
                      : ''}
                    {key === 'python_dependencies' && component.missing_modules?.length
                      ? ` · Missing: ${component.missing_modules.join(', ')}`
                      : ''}
                  </p>
                ))}
                {!componentStatuses.python_dependencies && (
                  <p>
                    Embeddings: {health.embedding_model_available ? 'loaded' : 'unavailable'} ·
                    {' '}Ollama: {health.ollama_connected ? 'connected' : 'unavailable'} ·
                    {' '}LLM: {health.configured_llm_available ? 'installed' : 'missing'}
                  </p>
                )}
              </div>
            )}
            {healthLoading && <p className="mt-3 text-xs text-slate-500">Checking local RAG readiness...</p>}
            {health?.indexed_at && (
              <p className="mt-1 text-[10px] text-slate-400">
                Last indexed: {new Date(health.indexed_at).toLocaleString()}
              </p>
            )}
            {healthError && <p className="mt-3 text-xs text-rose-700">{healthError}</p>}
            {!ragReady && Object.values(componentStatuses).some((component) => component.detail) && (
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-amber-800">
                {Object.entries(componentStatuses)
                  .filter(([, component]) => component.detail)
                  .map(([key, component]) => (
                    <p key={key}><strong>{COMPONENT_LABELS[key] ?? key}:</strong> {component.detail}</p>
                  ))}
              </div>
            )}
            {documentsError ? (
              <p className="mt-3 text-xs text-rose-700">
                Could not load indexed documents: {documentsError}
              </p>
            ) : documentsLoading ? (
              <p className="mt-3 text-xs text-slate-500">Loading indexed documents...</p>
            ) : documents.length ? (
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {documents.map((document) => (
                  <li key={document.filename} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    <span>
                      <span className="block font-medium text-slate-700">{document.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {document.filename} · {document.indexed_chunks} chunks
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                {health?.index_available ? 'No indexed documents were reported.' : 'No documents are indexed yet.'}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Suggested Health Queries
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => send(question)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-left text-xs text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                >
                  <p className="leading-snug">{question}</p>
                </button>
              ))}
            </div>
          </div>

          {messages.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Queries In Session
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {messages
                  .filter((message) => message.role === 'user')
                  .slice(-5)
                  .map((message, index) => (
                    <li key={`${message.text}-${index}`} className="truncate rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-slate-700">
                      "{message.text}"
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="flex min-h-[640px] flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-secondary">
                <Send size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">MoHFW Document Intelligence Session</h3>
                <p className="text-[11px] text-slate-400">Answers identify PDF evidence separately from structured dataset results</p>
              </div>
            </div>
            {(messages.length > 0 || sessionId) && (
              <button
                onClick={clearSession}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-critical disabled:opacity-50"
                title="Clear current message history"
              >
                <Trash2 size={13} />
                <span>Clear Session</span>
              </button>
            )}
          </div>

          <div className="my-2 flex-1 space-y-4 overflow-y-auto p-2">
            {messages.length === 0 && (
              <div className="my-16 flex flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Send size={20} />
                </div>
                <h4 className="text-base font-bold text-ink">Start a Document Inquiry</h4>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Ask questions about indexed documents and configured healthcare datasets.
                  Retrieved evidence and its source are shown with each response.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.slice(0, 2).map((question) => (
                    <button
                      key={question}
                      onClick={() => send(question)}
                      disabled={loading}
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              message.role === 'user' ? (
                <div key={`user-${index}`} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary px-4 py-2.5 text-xs text-white shadow-xs sm:text-sm">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={`assistant-${index}`} className="flex justify-start">
                  <div className="max-w-[90%] space-y-3 rounded-2xl rounded-tl-xs border border-slate-200/80 bg-slate-50 px-4 py-3.5 shadow-xs">
                    {message.result_type && (
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        {resultLabels[message.result_type] ?? message.result_type}
                      </span>
                    )}
                    <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">{message.answer}</p>
                    {message.error && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 ring-1 ring-rose-600/20">
                        Request failed — no answer was generated
                      </span>
                    )}
                    {((message.sources?.length ?? 0) > 0 || (message.data_sources?.length ?? 0) > 0) && (
                      <div className="space-y-2 border-t border-slate-200/80 pt-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Sources & Evidence
                        </span>
                        {(message.sources || []).map((source, sourceIndex) => (
                          <div key={`${source.document_name}-${source.page}-${sourceIndex}`} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                            <div className="flex items-center justify-between gap-2 font-bold text-primary">
                              <span>{source.document_name}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                {[source.section, source.page ? `p. ${source.page}` : null].filter(Boolean).join(' · ') || 'Document'}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] italic leading-relaxed text-slate-500">
                              "{source.excerpt}"
                            </p>
                            {source.source_url && (
                              <a className="mt-1 block text-[10px] text-secondary underline" href={source.source_url} target="_blank" rel="noreferrer">
                                {source.source_url}
                              </a>
                            )}
                          </div>
                        ))}
                        {(message.data_sources || []).map((source, sourceIndex) => (
                          <div key={`${source.filename}-${sourceIndex}`} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                            <p className="font-bold text-primary">
                              Structured dataset evidence · {source.dataset}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {source.filename}
                              {source.filters?.state
                                ? ` · State filter: ${Array.isArray(source.filters.state) ? source.filters.state.join(', ') : source.filters.state}`
                                : ''}
                              {source.filters?.financial_year
                                ? ` · Financial-year filter: ${Array.isArray(source.filters.financial_year) ? source.filters.financial_year.join(', ') : source.filters.financial_year}`
                                : ''}
                            </p>
                            {source.fields?.length > 0 && (
                              <p className="mt-1 text-[10px] text-slate-500">
                                Fields: {source.fields.join(', ')}
                              </p>
                            )}
                            {source.metrics?.map((metric) => (
                              <p key={metric} className="mt-1 text-[11px] text-slate-500">{metric}</p>
                            ))}
                            {source.calculations?.map((calculation, calculationIndex) => (
                              <p key={`${calculation.metric}-${calculationIndex}`} className="mt-1 text-[11px] text-slate-600">
                                Calculated {calculation.metric}{calculation.year ? ` (${calculation.year})` : ''}: {formatNumber(calculation.value)}
                                {' '}({calculation.method})
                              </p>
                            ))}
                            {source.records?.length > 0 && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-[11px] text-secondary">
                                  View {source.records.length} matching data record(s)
                                </summary>
                                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] text-slate-600">
                                  {formatRecords(source.records)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.limitations?.length > 0 && (
                      <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
                        <strong>Limitations:</strong> {message.limitations.join(' ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:0.3s]" />
                </div>
                <span>Retrieving evidence and generating a grounded response...</span>
              </div>
            )}
          </div>

          <form
            className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              maxLength={2000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about health budgets, NHM guidelines, allocations..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-ink placeholder-slate-400 transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:bg-primaryLight disabled:opacity-40"
              aria-label="Send query"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

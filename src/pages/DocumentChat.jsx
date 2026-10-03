import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { askDocumentQuestion } from '../services/documentService';
import { suggestedQuestions } from '../data/mockData';

export default function DocumentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    const res = await askDocumentQuestion(q);
    setMessages((m) => [...m, { role: 'ai', ...res }]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Document Intelligence"
        description="Conversational question-answering over official MoHFW circulars, National Health Mission guidelines, and expenditure notes."
        breadcrumb="AI & Intelligence / Document Chat"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-secondary ring-1 ring-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            RAG Pipeline Active
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Knowledge Base & Suggested Queries */}
        <aside className="space-y-4 lg:col-span-4">
          {/* Active Knowledge Base Info Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Indexed Documents
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                FAISS Vector Store
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span>MoHFW Union Budget Allocation Note</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span>National Health Mission MIS Review</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span>NHM Financial Progress & Absorption Reports</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span>MoHFW Primary Care Reform Agenda</span>
              </li>
            </ul>
          </div>

          {/* Suggested Questions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Suggested Health Queries
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="w-full text-left rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                >
                  <p className="leading-snug">{q}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History Drawer */}
          {messages.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Recent Queries In Session
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {messages
                  .filter((m) => m.role === 'user')
                  .slice(-5)
                  .map((m, i) => (
                    <li key={i} className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-700 border border-slate-100">
                      "{m.text}"
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Right Column: Conversational Workspace */}
        <section className="flex min-h-[640px] flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card lg:col-span-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-secondary">
                <Send size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">MoHFW Document Intelligence Session</h3>
                <p className="text-[11px] text-slate-400">Grounded semantic search with citations</p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-critical transition-colors"
                title="Clear current message history"
              >
                <Trash2 size={13} />
                <span>Clear Session</span>
              </button>
            )}
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto p-2 my-2">
            {messages.length === 0 && (
              <div className="my-16 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <Send size={20} />
                </div>
                <h4 className="text-base font-bold text-ink">Start a Document Inquiry</h4>
                <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                  Query official MoHFW circulars, NHM financial frameworks, and procurement guidelines. Answers are grounded with verbatim source citations.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.slice(0, 2).map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary px-4 py-2.5 text-xs sm:text-sm text-white shadow-xs">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] space-y-3 rounded-2xl rounded-tl-xs bg-slate-50 border border-slate-200/80 px-4 py-3.5 shadow-xs">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {m.answer}
                    </p>

                    {m.mode === 'mock-demo' && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-600/20">
                        Demo Mode — RAG backend offline
                      </span>
                    )}

                    {m.sources && m.sources.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Document Sources & Evidence
                        </span>
                        {m.sources.map((s, j) => (
                          <div key={j} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                            <div className="flex items-center justify-between gap-2 text-primary font-bold">
                              <span>{s.document}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                {s.section}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] italic text-slate-500 leading-relaxed">
                              "{s.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 w-fit">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:0.3s]" />
                </div>
                <span>Retrieving document chunks from vector index...</span>
              </div>
            )}
          </div>

          {/* Query Input Bar */}
          <form
            className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about health budgets, NHM guidelines, allocations..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs sm:text-sm text-ink placeholder-slate-400 transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm hover:bg-primaryLight transition-all disabled:opacity-40"
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

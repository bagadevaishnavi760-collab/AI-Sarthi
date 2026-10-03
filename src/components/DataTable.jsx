import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';

// Table with client-side search and sortable columns.
// columns: [{ key, label, render?, sortValue? }]
export default function DataTable({ columns, rows, emptyMessage = 'No matching records.', searchable = true, searchPlaceholder = 'Search...' }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const visible = useMemo(() => {
    let r = rows;
    if (query) {
      const q = query.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q)));
    }
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      r = [...r].sort((a, b) => {
        const av = col.sortValue ? col.sortValue(a) : a[sort.key];
        const bv = col.sortValue ? col.sortValue(b) : b[sort.key];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
        return String(av ?? '').localeCompare(String(bv ?? '')) * sort.dir;
      });
    }
    return r;
  }, [rows, query, sort, columns]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir * -1 } : { key, dir: 1 }));

  return (
    <div className="w-full">
      {searchable && (
        <div className="relative mb-4 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-ink placeholder-slate-400 shadow-sm transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-xs font-medium text-slate-500">
            {visible.length} {visible.length === 1 ? 'record' : 'records'}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm">
            <thead>
              <tr className="bg-slate-50/90">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="group inline-flex items-center gap-1.5 transition hover:text-secondary focus:outline-none"
                    >
                      <span>{col.label}</span>
                      <span className="flex flex-col text-slate-400 group-hover:text-secondary">
                        {sort.key === col.key ? (
                          sort.dir === 1 ? (
                            <ArrowUp size={13} className="text-secondary" />
                          ) : (
                            <ArrowDown size={13} className="text-secondary" />
                          )
                        ) : (
                          <span className="opacity-0 transition-opacity group-hover:opacity-60">↕</span>
                        )}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                    <p className="font-medium text-slate-500">{emptyMessage}</p>
                    {query && <p className="mt-1 text-xs text-slate-400">No results found for "{query}"</p>}
                  </td>
                </tr>
              ) : (
                visible.map((row, i) => (
                  <tr
                    key={row.key ?? i}
                    className="transition-colors duration-150 hover:bg-blue-50/30"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

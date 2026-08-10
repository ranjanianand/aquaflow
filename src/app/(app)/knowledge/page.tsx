'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { BookOpen, Search, Plus } from 'lucide-react';
import { useKnowledge } from '@/lib/api/hooks';

/**
 * Procedures, troubleshooting notes and standing instructions.
 *
 * Content the client authors and this system stores. The previous version
 * listed articles nobody had written — plausible titles, plausible authors,
 * none of it real.
 *
 * Empty is the correct state for a new deployment, and it is shown as empty
 * rather than filled. The search is full-text against the article body, so it
 * works from the first article onwards.
 */
export default function KnowledgePage() {
  const [search, setSearch] = useState('');
  const { data, error, loading } = useKnowledge(search || undefined);
  const articles = data ?? [];

  return (
    <div className="min-h-screen">
      <Header title="Knowledge Base" subtitle="Procedures and troubleshooting notes" />

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search procedures…"
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 bg-white
                         focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Authoring needs an editor and a permission model, neither of which
              exists. Disabled and labelled, rather than opening a form that
              cannot save. */}
          <button
            disabled
            title="Authoring is not built yet"
            className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold
                       border border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            New article
          </button>
        </div>

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-800">{error.message}</p>
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="border border-slate-200 bg-white px-6 py-12 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-1">
              {search ? 'No articles match that search' : 'No articles yet'}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {search
                ? 'Try a different term.'
                : 'Standard operating procedures, backwash instructions and '
                  + 'troubleshooting notes belong here. The store is ready; '
                  + 'nothing has been written to it.'}
            </p>
          </div>
        )}

        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((a) => (
              <article key={a.id} className="border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {a.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.excerpt}</p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                  {a.author && <span>{a.author}</span>}
                  <span>{new Date(a.updatedAt).toLocaleDateString()}</span>
                  {a.plantCode && <span className="font-mono">{a.plantCode}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

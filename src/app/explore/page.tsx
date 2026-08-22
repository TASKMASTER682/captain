'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/config';
import PublicHeader from '@/components/PublicHeader';
import {
  Search, Loader2, ChevronLeft, ChevronRight, CreditCard,
  BookOpenCheck, X, ArrowRight, GraduationCap,
} from 'lucide-react';

const PAGE_SIZE = 12;

function PriceBadge({ price }: { price: number }) {
  if (!price || price <= 0) {
    return (
      <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
        <CreditCard className="w-3 h-3" /> Free
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold text-amber-600 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
      <CreditCard className="w-3 h-3" /> ₹{price}
    </span>
  );
}

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced server-side search over title/description/tags.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearching(false);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (query.trim()) params.set('q', query.trim());
        const res = await fetch(`${API_BASE}/test-series/public?${params.toString()}`);
        const json = await res.json();
        if (cancelled) return;
        setItems(Array.isArray(json?.data) ? json.data : []);
        setPagination(json?.pagination || { total: 0, page: 1, pages: 1 });
      } catch (_e) {
        if (!cancelled) setItems([]);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [page, query]);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compact page list: 1 … 4 5 6 … 12
  const pageButtons = () => {
    const { page: current, pages } = pagination;
    const out: (number | '…')[] = [];
    const push = (v: number | '…') => out.push(v);
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) push(i);
      return out;
    }
    push(1);
    if (current > 3) push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(pages - 1, current + 1); i++) push(i);
    if (current < pages - 2) push('…');
    push(pages);
    return out;
  };

  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(pagination.total, pagination.page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        {/* Hero strip */}
        <section className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-black font-outfit tracking-tight">
            Explore <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Test Series</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Full-length CBT mock test series for every major government exam. Pick a series, see what's inside, and start practising today.
          </p>
        </section>

        {/* Search */}
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all max-w-2xl w-full mx-auto">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by title, exam, or tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
            aria-label="Search test series"
          />
          {(searching || loading) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {query && !searching && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-muted-foreground -mt-4">
            {pagination.total > 0
              ? <>Showing <span className="font-semibold text-foreground">{start}–{end}</span> of <span className="font-semibold text-foreground">{pagination.total}</span> test series{query.trim() ? ` for "${query.trim()}"` : ''}</>
              : ''}
          </p>
        )}

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-36 bg-muted" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-8 w-full rounded-xl bg-muted mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-3">
            <BookOpenCheck className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {query.trim() ? `No test series match "${query.trim()}".` : 'No test series available yet. Check back soon!'}
            </p>
            {query.trim() && (
              <button onClick={() => setQuery('')} className="text-xs font-bold text-primary hover:underline">Clear search</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((ts) => (
              <Link
                key={ts._id}
                href={`/explore/${ts.slug || ts._id}`}
                className="group rounded-3xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all flex flex-col"
              >
                {/* Banner */}
                <div className="h-36 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary relative overflow-hidden">
                  {ts.banner ? (
                    <img src={ts.banner} alt={ts.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {ts.examId?.name && (
                      <span className="text-[10px] font-bold text-white px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">{ts.examId.name}</span>
                    )}
                    {ts.featured && (
                      <span className="text-[10px] font-bold text-amber-300 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">★ Featured</span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold font-outfit leading-snug line-clamp-2 group-hover:text-primary transition-colors">{ts.title}</h2>
                  </div>
                  {ts.description && <p className="text-xs text-muted-foreground line-clamp-2">{ts.description}</p>}
                  {ts.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ts.tags.slice(0, 4).map((tag: string) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
                    <PriceBadge price={ts.price} />
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <nav className="flex items-center justify-center gap-1.5 flex-wrap" aria-label="Pagination">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            {pageButtons().map((p, i) =>
              p === '…' ? (
                <span key={`e-${i}`} className="px-1.5 text-xs text-muted-foreground">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === pagination.page ? 'page' : undefined}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                    p === pagination.page
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'border border-border bg-card hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for prerendering.
export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExplorePageContent />
    </Suspense>
  );
}

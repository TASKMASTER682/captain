'use client';

// Global on-type search across test series, study material and articles.
// Groups come straight from the backend contract — the UI renders whatever
// entity types exist, so new searchable blocks appear without UI changes.
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Search, Loader2, X, BookOpenCheck, FolderOpen, Newspaper,
  FileText, GraduationCap, SearchX,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'test-series': GraduationCap,
  'study-material': FolderOpen,
  'current-affairs': Newspaper,
};

const FALLBACK_ICON = FileText;

export default function GlobalSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Live search — fires while typing (debounced), never on submit
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setGroups(Array.isArray(res?.data?.groups) ? res.data.groups : []);
      } catch (_e) {
        setGroups([]);
      }
      setLoading(false);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const hasResults = groups.some((g) => g.items?.length > 0);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/50 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Search courses, test series, study material..."
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 min-w-0"
          aria-label="Global search"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
        ) : query ? (
          <button onClick={() => { setQuery(''); setGroups([]); }} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Clear search">
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Results dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl z-[90] p-3 flex flex-col gap-3">
          {!loading && !hasResults ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <SearchX className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No results for "{query.trim()}"</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.type}>
                <div className="flex items-center gap-2 px-1 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-col gap-1">
                  {group.items.map((item: any) => {
                    const Icon = TYPE_ICONS[group.type] || FALLBACK_ICON;
                    return (
                      <button
                        key={item._id}
                        onClick={() => go(item.href)}
                        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                      >
                        <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary overflow-hidden flex items-center justify-center shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </span>
                        <span className="flex flex-col min-w-0 leading-tight gap-0.5">
                          <span className="text-sm font-semibold truncate">{item.title}</span>
                          {item.subtitle && <span className="text-[11px] text-muted-foreground line-clamp-1">{item.subtitle}</span>}
                          {item.meta?.length > 0 && (
                            <span className="flex items-center gap-1 flex-wrap">
                              {item.meta.map((m: string, i: number) => (
                                <span key={i} className="text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">{m}</span>
                              ))}
                            </span>
                          )}
                        </span>
                        <BookOpenCheck className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

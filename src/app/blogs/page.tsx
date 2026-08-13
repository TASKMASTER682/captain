'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, Newspaper, Search, CalendarDays, Eye, FileText, File, Video } from 'lucide-react';
import Link from 'next/link';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debounced) params.set('search', debounced);
        const res = await api.get(`/blogs/published?${params.toString()}`);
        setBlogs(res.data || []);
      } catch { setBlogs([]); }
      setLoading(false);
    };
    load();
  }, [debounced]);

  const typeMeta: any = {
    note: { icon: FileText, label: 'Note', color: 'text-sky-500' },
    pdf: { icon: File, label: 'PDF', color: 'text-rose-500' },
    video: { icon: Video, label: 'Video', color: 'text-violet-500' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-playfair flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" /> Blogs & Articles
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search blogs by title, subject, tags..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading blogs...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground">
            <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold">No published blogs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.map((b: any) => (
              <Link key={b._id} href={`/blogs/${b._id}`}
                className="p-6 rounded-3xl border border-border bg-card hover:border-primary/30 transition-all flex flex-col gap-3 group">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {b.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{b.subject}</span>}
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : new Date(b.updatedAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {b.viewCount || 0}</span>
                </div>
                <h2 className="text-lg font-bold font-playfair leading-snug group-hover:text-primary transition-colors">{b.title}</h2>
                {b.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{b.excerpt}</p>}

                {b.tags && b.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {b.tags.slice(0, 5).map((t: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border border-primary/20 bg-primary/10 text-primary">#{t}</span>
                    ))}
                  </div>
                )}

                {b.materials && b.materials.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {b.materials.map((m: any) => {
                      const meta = typeMeta[m.type] || typeMeta.note;
                      const Icon = meta.icon;
                      return (
                        <span key={m._id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] font-semibold ${meta.color}`}>
                          <Icon className="w-3 h-3" /> {m.title.length > 24 ? m.title.slice(0, 24) + '…' : m.title}
                        </span>
                      );
                    })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

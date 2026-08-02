'use client';

import React, { useEffect, useState } from 'react';
import { api, getAuthUser, API_BASE } from '@/lib/api';
import { ArrowLeft, Search, FileText, File, Video, Download, FolderOpen, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const typeMeta: any = {
  note: { icon: FileText, color: 'text-sky-500 bg-sky-500/10', label: 'Note' },
  pdf: { icon: File, color: 'text-rose-500 bg-rose-500/10', label: 'PDF' },
  video: { icon: Video, color: 'text-violet-500 bg-violet-500/10', label: 'Video' },
};

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push('/login'); return; }
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (typeFilter) params.set('type', typeFilter);
        params.set('active', 'true');
        const res = await api.get(`/materials?${params.toString()}`);
        setMaterials(res.data || []);
      } catch (err: any) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [debouncedSearch, typeFilter]);

  const handleDownload = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      window.open(`${API_BASE}/materials/${id}/download?token=${encodeURIComponent(token || '')}`, '_blank');
    } catch (err) { /* handled by server */ }
  };

  const typeFilterButtons = ['', 'note', 'pdf', 'video'];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" /> Study Materials
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Search & filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, subject, topic or tags..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {typeFilterButtons.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${typeFilter === t ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                {t === '' ? 'All' : (typeMeta[t]?.label || t)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20 border rounded-3xl bg-card text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No study materials found.</p>
            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.map((m: any) => {
              const meta = typeMeta[m.type] || typeMeta.note;
              const Icon = meta.icon;
              return (
                <div key={m._id} className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-bold uppercase">{meta.label}</span>
                  </div>
                  <h3 className="font-bold text-sm font-outfit line-clamp-2">{m.title}</h3>
                  {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    {m.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{m.subject}</span>}
                    {m.examId?.name && <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground">{m.examId.name}</span>}
                    {m.fileSize && <span className="text-muted-foreground">{m.fileSize}</span>}
                  </div>
                  {m.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {m.tags.slice(0, 5).map((t: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSearch(t)}
                          className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleDownload(m._id)}
                    className="mt-auto w-full py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {m.type === 'video' ? 'Open Video' : 'Download'} · {m.downloadCount || 0}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

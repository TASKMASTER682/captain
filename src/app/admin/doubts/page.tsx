'use client';

import React, { useEffect, useState } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, HelpCircle, Bot, Trash2, Search, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDoubts() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const user = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!user || !staffRoles.includes(user.role)) { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await api.get(`/doubts?${params.toString()}`);
      setItems(res.data || []);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doubt and all replies?')) return;
    try { await api.delete(`/doubts/${id}`); await load(search); }
    catch (err: any) { alert(err.message); }
  };

  const statusColor: any = { open: 'bg-amber-500/10 text-amber-500', answered: 'bg-emerald-500/10 text-emerald-500', resolved: 'bg-sky-500/10 text-sky-500' };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-lg font-outfit">Doubts Forum</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value); }} placeholder="Search doubts..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No doubts yet.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((d: any) => (
              <Link key={d._id} href={`/doubts?id=${d._id}`} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{d.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor[d.status] || statusColor.open}`}>{d.status}</span>
                      {d.aiAnswered && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[9px] font-bold"><Bot className="w-2.5 h-2.5" /> AI</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>By {d.author?.name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{d.replyCount || 0}</span>
                      <span>{new Date(d.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(d._id); }} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

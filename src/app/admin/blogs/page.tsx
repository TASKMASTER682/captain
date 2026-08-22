'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Plus, Edit3, Trash2, Search, Newspaper, Eye, EyeOff, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function BlogsManagement() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const activeUser = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!activeUser || !staffRoles.includes(activeUser.role)) { router.push('/login'); return; }
    setUser(activeUser);
    load();
  }, [router]);

  const load = async (q = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (status) params.set('status', status);
      const res = await api.get(`/blogs?${params.toString()}`);
      setItems(res.data || []);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const onSearchChange = (v: string) => { setSearch(v); load(v, statusFilter); };
  const onStatusChange = (v: string) => { setStatusFilter(v); load(search, v); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog? This cannot be undone.')) return;
    try { await api.delete(`/blogs/${id}`); await load(search, statusFilter); }
    catch (err: any) { alert(err.message); }
  };

  const togglePublish = async (b: any) => {
    try {
      await api.put(`/blogs/${b._id}`, { status: b.status === 'published' ? 'draft' : 'published' });
      await load(search, statusFilter);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search blogs by title, subject, tags..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Status</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No blogs yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(b => (
              <div key={b._id} className={`p-5 rounded-2xl border bg-card flex items-start justify-between gap-4 transition-all ${b.status === 'published' ? 'border-border' : 'border-amber-500/30 bg-amber-500/[0.02]'}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${b.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm font-playfair line-clamp-1">{b.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${b.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{b.status}</span>
                    </div>
                    {b.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{b.excerpt}</p>}
                    <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[10px] text-muted-foreground">
                      {b.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{b.subject}</span>}
                      <span>{b.materials?.length || 0} materials</span>
                      <span>{b.viewCount || 0} views</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : new Date(b.updatedAt).toLocaleDateString()}
                      </span>
                      {(b.tags || []).slice(0, 3).map((t: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-primary/20 bg-primary/10 text-primary">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePublish(b)} title={b.status === 'published' ? 'Move to Draft' : 'Publish'}
                    className={`p-2 rounded-xl transition-colors ${b.status === 'published' ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                    {b.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Link href={`/admin/blogs/editor?id=${b._id}`} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></Link>
                  <button onClick={() => handleDelete(b._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
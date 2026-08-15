'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Bug, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Trash2, XCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_FILTERS = ['All', 'Unresolved', 'Resolved', 'Ignored'];
const SOURCE_FILTERS = ['All', 'client', 'server'];

export default function ErrorLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unresolved, setUnresolved] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page, status, source, q]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status !== 'All') params.set('status', status);
      if (source !== 'All') params.set('source', source);
      if (q.trim()) params.set('q', q.trim());
      const res = await api.get(`/errors?${params.toString()}`);
      setLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setUnresolved(res.data?.unresolved || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const changeStatus = async (id: string, next: string) => {
    setBusyId(id);
    try {
      await api.patch(`/errors/${id}/status`, { status: next });
      await load();
    } catch (err) { console.error(err); }
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this error log?')) return;
    setBusyId(id);
    try {
      await api.delete(`/errors/${id}`);
      await load();
    } catch (err) { console.error(err); }
    setBusyId(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Bug className="w-5 h-5 text-rose-500" />
          <h1 className="font-bold text-lg font-outfit">Error Logs</h1>
          {unresolved > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">{unresolved} unresolved</span>
          )}
        </div>
        <button onClick={load} className="p-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700"><RefreshCw className="w-4 h-4" /></button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by message..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-border bg-card text-sm">
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-border bg-card text-sm">
            {SOURCE_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All sources' : s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><Bug className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No error logs match.</p></div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {logs.map(l => (
              <div key={l._id} className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      l.source === 'server' ? 'bg-violet-500/10 text-violet-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>{l.type}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      l.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                      l.status === 'Ignored' ? 'bg-slate-500/10 text-slate-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>{l.status}</span>
                    {l.statusCode ? <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-500 text-[10px] font-bold">{l.statusCode}</span> : null}
                    <span className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {l.status !== 'Resolved' && (
                      <button onClick={() => changeStatus(l._id, 'Resolved')} disabled={busyId === l._id} title="Mark resolved" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-4 h-4" /></button>
                    )}
                    {l.status !== 'Ignored' && (
                      <button onClick={() => changeStatus(l._id, 'Ignored')} disabled={busyId === l._id} title="Ignore" className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-500"><XCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => remove(l._id)} disabled={busyId === l._id} title="Delete" className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2 break-words">{l.message}</p>
                <div className="text-[10px] text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {l.url ? <span className="truncate max-w-full">{l.url}</span> : null}
                  {l.userId?.name ? <span>{l.userId.name} ({l.userId.email || '—'})</span> : null}
                  <span>{l.userAgent ? l.userAgent.split(' ')[0] : 'Unknown browser'}</span>
                  {l.ip ? <span>IP: {l.ip}</span> : null}
                </div>
                {l.stack && (
                  <div className="mt-2">
                    <button onClick={() => setExpanded(expanded === l._id ? null : l._id)} className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      {expanded === l._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      Stack trace
                    </button>
                    {expanded === l._id && (
                      <pre className="mt-2 p-3 rounded-xl bg-muted text-[10px] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">{l.stack}</pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40">Prev</button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold disabled:opacity-40">Next</button>
          </div>
        )}
      </main>
    </div>
  );
}
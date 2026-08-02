'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, HelpCircle, Plus, Send, X, Search, Bot, CheckCircle2, Trash2, MessageSquare, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RichText } from '@/components/RichText';

function DoubtsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeDoubtId = searchParams.get('id');

  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ questionId: '', title: '', body: '', subject: '', topic: '' });

  // Detail view state
  const [detail, setDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

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
        const res = await api.get(`/doubts?${params.toString()}`);
        setDoubts(res.data || []);
      } catch (err: any) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!activeDoubtId) { setDetail(null); return; }
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const r = await api.get(`/doubts/${activeDoubtId}`);
        if (cancelled) return;
        setDetail(r.data);
      } catch {}
    };
    fetchDetail();
    // While AI is still generating, poll so the reply appears live.
    const poll = setInterval(async () => {
      try {
        const r = await api.get(`/doubts/${activeDoubtId}`);
        if (cancelled) return;
        setDetail(r.data);
        const d = r.data?.doubt;
        if (d && (d.aiAnswered || d.status !== 'open')) clearInterval(poll);
      } catch {}
    }, 4000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [activeDoubtId]);

  const handleCreate = async () => {
    if (!form.title || !form.body) { alert('Title and question are required.'); return; }
    try {
      const res = await api.post('/doubts', form);
      setShowForm(false);
      setForm({ questionId: '', title: '', body: '', subject: '', topic: '' });
      router.push(`/doubts?id=${res.data._id}`);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !detail) return;
    setReplyBusy(true);
    try {
      await api.post(`/doubts/${detail.doubt._id}/reply`, { body: replyText });
      setReplyText('');
      const res = await api.get(`/doubts/${detail.doubt._id}`);
      setDetail(res.data);
    } catch (err: any) { alert(err.message); }
    setReplyBusy(false);
  };

  const handleResolve = async () => {
    try {
      await api.patch(`/doubts/${detail.doubt._id}/resolve`, {});
      const res = await api.get(`/doubts/${detail.doubt._id}`);
      setDetail(res.data);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doubt and all its replies?')) return;
    try {
      await api.delete(`/doubts/${id}`);
      if (activeDoubtId === id) router.push('/doubts');
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const statusColor: any = { open: 'bg-amber-500/10 text-amber-500', answered: 'bg-emerald-500/10 text-emerald-500', resolved: 'bg-sky-500/10 text-sky-500' };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-violet-500" /> Doubts Forum
          </h1>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Ask Doubt
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex gap-8">
        {/* Left: doubt list */}
        <div className={`flex flex-col gap-5 ${activeDoubtId ? 'hidden lg:flex lg:w-1/3' : 'w-full'}`}>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doubts by title, subject..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading doubts...</div>
          ) : doubts.length === 0 ? (
            <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No doubts yet.</p>
              <p className="text-xs mt-1">Ask a question and get an instant AI answer.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {doubts.map((d: any) => (
                <Link key={d._id} href={`/doubts?id=${d._id}`}
                  className={`p-5 rounded-2xl border bg-card transition-all hover:border-primary/30 ${activeDoubtId === d._id ? 'border-primary/50 bg-primary/[0.03]' : 'border-border'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold line-clamp-1">{d.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${statusColor[d.status] || statusColor.open}`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <MessageSquare className="w-3 h-3" /> {d.replyCount || 0} replies
                    {d.aiAnswered && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500"><Bot className="w-2.5 h-2.5" /> AI</span>}
                    {d.subject && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{d.subject}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: doubt detail */}
        {activeDoubtId && (
          <div className="flex-1 min-w-0">
            {!detail ? (
              <div className="text-center py-20 text-muted-foreground">Loading...</div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor[detail.doubt.status] || statusColor.open}`}>{detail.doubt.status}</span>
                      {detail.doubt.aiAnswered && <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[9px] font-bold"><Bot className="w-3 h-3" /> AI Answered</span>}
                      {detail.doubt.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{detail.doubt.subject}</span>}
                    </div>
                    <div className="flex gap-2">
                      {detail.doubt.status !== 'resolved' && (
                        <button onClick={handleResolve} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                      <button onClick={() => handleDelete(detail.doubt._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold font-outfit">{detail.doubt.title}</h2>
                  <div className="text-sm text-muted-foreground"><RichText text={detail.doubt.body} /></div>
                  <span className="text-[10px] text-muted-foreground">Asked by {detail.doubt.author?.name || 'Anonymous'} · {new Date(detail.doubt.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {!detail.doubt.aiAnswered && (
                    <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-violet-500" /> AI is preparing an answer... You can keep working, it will appear here.
                      </span>
                    </div>
                  )}
                  {detail.replies.map((r: any) => (
                    <div key={r._id} className={`p-5 rounded-2xl border flex flex-col gap-1.5 ${r.isAI ? 'border-violet-500/30 bg-violet-500/[0.04]' : r.isAdmin ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-border bg-card'}`}>
                      <div className="flex items-center gap-2">
                        {r.isAI ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold"><Bot className="w-3 h-3" /> AI Tutor</span>
                        ) : r.isAdmin ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold"><ShieldCheck className="w-3 h-3" /> {r.authorName || 'Staff'}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">{r.authorName || 'Student'}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm"><RichText text={r.body} /></div>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-3xl border border-border bg-card flex flex-col gap-3">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm h-24 outline-none focus:ring-2 focus:ring-primary/20" />
                  <button onClick={handleReply} disabled={replyBusy || !replyText.trim()}
                    className="self-end px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 disabled:opacity-50 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> {replyBusy ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Ask Doubt Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-lg p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit flex items-center gap-2"><HelpCircle className="w-5 h-5 text-violet-500" /> Ask a Doubt</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">An AI tutor will answer automatically. Anyone can also reply below.</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. How to solve quadratic inequalities?" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Your Question</label>
                <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm h-32" placeholder="Describe your doubt in detail..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Mathematics" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Topic</label>
                  <input type="text" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Algebra" />
                </div>
              </div>
            </div>
            <button onClick={handleCreate} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 flex items-center justify-center gap-2 text-sm">
              <Send className="w-4 h-4" /> Ask & Get AI Answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoubtsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading...</div>}>
      <DoubtsPage />
    </Suspense>
  );
}

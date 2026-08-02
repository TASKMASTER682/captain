'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, ClipboardList, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AttemptViewer() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (status) params.set('status', status);
      const res = await api.get(`/admin/attempts?${params.toString()}`);
      setAttempts(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/admin/attempts/${id}`);
      setDetail(res.data);
    } catch (err: any) { alert(err.message); }
  };

  const statusBadge = (s: string) => ({
    'In Progress': 'bg-amber-500/10 text-amber-500',
    'Submitted': 'bg-emerald-500/10 text-emerald-500',
    'Expired': 'bg-rose-500/10 text-rose-500',
    'Abandoned': 'bg-slate-500/10 text-slate-400',
  }[s] || 'bg-secondary text-muted-foreground');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <ClipboardList className="w-5 h-5 text-violet-500" />
          <h1 className="font-bold text-lg font-outfit">Student Attempts</h1>
        </div>
        <button onClick={load} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">Refresh</button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search student by name or email..." value={query}
              onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setTimeout(load, 0); }} className="px-4 py-3 rounded-xl border border-border bg-card text-xs font-semibold">
            <option value="">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Expired">Expired</option>
          </select>
          <button onClick={load} className="px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90">Search</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No attempts found.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {attempts.map(a => (
              <div key={a._id} className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{a.testId?.title || 'Test'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadge(a.status)}`}>{a.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{a.studentId?.name} · {a.studentId?.email}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Started {new Date(a.startedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black font-outfit">{a.score ?? a.result?.obtainedMarks ?? '—'}</div>
                      <div className="text-[10px] text-muted-foreground">Score</div>
                    </div>
                    <button onClick={() => openDetail(a._id)} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit">{detail.testId?.title}</h3>
                <p className="text-xs text-muted-foreground">{detail.studentId?.name} ({detail.studentId?.email}) · {new Date(detail.startedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              {detail.result && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-muted/20"><div className="text-xl font-black font-outfit text-emerald-500">{detail.result.obtainedMarks}</div><div className="text-[10px] text-muted-foreground font-semibold">Marks</div></div>
                  <div className="p-4 rounded-xl border border-border bg-muted/20"><div className="text-xl font-black font-outfit">{detail.result.accuracy}%</div><div className="text-[10px] text-muted-foreground font-semibold">Accuracy</div></div>
                  <div className="p-4 rounded-xl border border-border bg-muted/20"><div className="text-xl font-black font-outfit text-emerald-500">{detail.result.correctCount}</div><div className="text-[10px] text-muted-foreground font-semibold">Correct</div></div>
                  <div className="p-4 rounded-xl border border-border bg-muted/20"><div className="text-xl font-black font-outfit text-rose-500">{detail.result.incorrectCount}</div><div className="text-[10px] text-muted-foreground font-semibold">Wrong</div></div>
                </div>
              )}
              {!detail.result && <p className="text-xs text-muted-foreground">Attempt not submitted yet — no result available.</p>}

              <div className="flex flex-col gap-2">
                {(detail.answers || []).map((ans: any, idx: number) => {
                  const q = ans.questionId;
                  const isOpen = expanded === ans._id;
                  return (
                    <div key={ans._id || idx} className="rounded-xl border border-border overflow-hidden">
                      <button onClick={() => setExpanded(isOpen ? null : ans._id)} className="w-full p-4 flex items-center justify-between gap-3 hover:bg-muted/20 text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`shrink-0 w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${ans.isCorrect === true ? 'bg-emerald-500/10 text-emerald-500' : ans.isCorrect === false ? 'bg-rose-500/10 text-rose-500' : 'bg-secondary text-muted-foreground'}`}>{idx + 1}</span>
                          <span className="text-xs font-medium truncate">{q?.body || q?.text || 'Question'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ans.isCorrect === true ? 'bg-emerald-500/10 text-emerald-500' : ans.isCorrect === false ? 'bg-rose-500/10 text-rose-500' : 'bg-secondary text-muted-foreground'}`}>
                            {ans.isCorrect === true ? 'Correct' : ans.isCorrect === false ? 'Wrong' : 'Skipped'}
                          </span>
                          <span className="text-[10px] font-bold">{ans.marksAwarded ?? 0}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isOpen && q && (
                        <div className="p-4 border-t border-border/40 bg-muted/10">
                          <div className="text-xs whitespace-pre-wrap">{q.body}</div>
                          {(q.options || []).map((opt: any, i: number) => (
                            <div key={i} className={`mt-2 p-2.5 rounded-lg border text-xs ${opt.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'border-border bg-card'}`}>
                              {String.fromCharCode(65 + i)}. {opt.text}
                            </div>
                          ))}
                          <div className="text-[10px] text-muted-foreground mt-2">
                            Student answer: {Array.isArray(ans.selectedAnswer) && ans.selectedAnswer.length ? ans.selectedAnswer.join(', ') : ans.numericAnswer ?? '—'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

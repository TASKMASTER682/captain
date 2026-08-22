'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import {
  ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Trash2, RefreshCw,
  Copy, AlertTriangle, Search, FileWarning
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuestionRenderer from '@/components/QuestionRenderer';
import AdminLayout from '@/components/AdminLayout';

export default function ContentModeration() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [staged, setStaged] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dupData, setDupData] = useState<any[]>([]);
  const [testId, setTestId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [marks, setMarks] = useState(1);
  const [negMarks, setNegMarks] = useState(0);
  const [mode, setMode] = useState<'bank' | 'test'>('bank');
  const [tests, setTests] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const activeUser = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager'];
    if (!activeUser || !staffRoles.includes(activeUser.role)) { router.push('/login'); return; }
    setUser(activeUser);
    loadAll();
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [stagedRes, dupRes, testsRes] = await Promise.all([
        api.get('/questions/staged/all').catch(() => ({ data: [] })),
        api.get('/questions/staged/duplicates').catch(() => ({ data: [], duplicateCount: 0 })),
        api.get('/tests').catch(() => ({ data: [] })),
      ]);
      setStaged(Array.isArray(stagedRes.data) ? stagedRes.data : []);
      setDupData(Array.isArray(dupRes.data) ? dupRes.data : []);
      setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === staged.length) setSelected(new Set());
    else setSelected(new Set(staged.map((s: any) => s._id)));
  };

  const approveToBank = async () => {
    if (selected.size === 0) { setError('Select at least one staged question.'); return; }
    if (!confirm(`Approve ${selected.size} question(s) to the main Question Bank?`)) return;
    try {
      const res = await api.post('/questions/staged/approve', { ids: Array.from(selected) });
      setMessage(res.message || 'Approved successfully.');
      setSelected(new Set());
      await loadAll();
    } catch (err: any) { setError(err.message); }
  };

  const approveToTest = async () => {
    if (selected.size === 0) { setError('Select at least one staged question.'); return; }
    if (!testId) { setError('Select a test to add questions to.'); return; }
    if (!confirm(`Approve ${selected.size} question(s) into test?`)) return;
    try {
      const res = await api.post('/questions/staged/approve-to-test', {
        ids: Array.from(selected),
        testId,
        sectionName: sectionName || undefined,
        marksPerQuestion: marks,
        negativeMarksPerQuestion: negMarks,
      });
      setMessage(res.message || 'Approved to test.');
      setSelected(new Set());
      await loadAll();
    } catch (err: any) { setError(err.message); }
  };

  const rejectSelected = async () => {
    if (selected.size === 0) { setError('Select at least one staged question.'); return; }
    if (!confirm(`Delete ${selected.size} staged question(s)?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => api.delete(`/questions/staged/${id}`)));
      setMessage(`Deleted ${selected.size} staged question(s).`);
      setSelected(new Set());
      await loadAll();
    } catch (err: any) { setError(err.message); }
  };

  const duplicateMap = new Map<string, any>();
  dupData.forEach((d) => { if (d._id) duplicateMap.set(d._id, d); });

  if (!user) return <AdminLayout user={user}><div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div></AdminLayout>;

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {message}
          </div>
        )}

        {/* Approve toolbar */}
        <div className="p-5 rounded-3xl border border-border bg-card flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm font-outfit">Approve Selected ({selected.size})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Review staged questions below, then approve to bank or directly into a test.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={approveToBank} disabled={selected.size === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve to Bank
              </button>
              <button onClick={rejectSelected} disabled={selected.size === 0}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={mode === 'bank'} onChange={() => setMode('bank')} className="w-4 h-4 accent-emerald-500" />
              Approve to Question Bank
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={mode === 'test'} onChange={() => setMode('test')} className="w-4 h-4 accent-violet-500" />
              Approve into Test
            </label>
            {mode === 'test' && (
              <>
                <select value={testId} onChange={(e) => setTestId(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs">
                  <option value="">Select test...</option>
                  {tests.map((t: any) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
                <input type="text" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section name (optional)" className="px-3 py-2 rounded-xl border border-border bg-background text-xs" />
              </>
            )}
          </div>
          {mode === 'test' && (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Marks/Q</label>
                <input type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-border bg-background text-xs" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Neg Marks/Q</label>
                <input type="number" value={negMarks} onChange={(e) => setNegMarks(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-border bg-background text-xs" />
              </div>
            </div>
          )}
          {mode === 'test' && (
            <button onClick={approveToTest} disabled={selected.size === 0 || !testId}
              className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1.5 self-start">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve {selected.size} to Test
            </button>
          )}
        </div>

        {/* Staged list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : staged.length === 0 ? (
          <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/30" />
            <p className="font-semibold">No pending staged questions.</p>
            <p className="text-xs">Upload or paste questions to start the moderation queue.</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-2.5 flex items-center gap-4 bg-muted/30 rounded-2xl">
              <input type="checkbox" checked={selected.size === staged.length} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select All ({staged.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {staged.map((s: any, idx: number) => {
                const dup = duplicateMap.get(s._id);
                const isDup = !!dup?.duplicateMatchType;
                return (
                  <div key={s._id} className={`p-5 rounded-3xl border bg-card ${isDup ? 'border-rose-500/30 bg-rose-500/[0.03]' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="shrink-0 w-6 h-6 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">{s.importStatus || 'Pending Review'}</span>
                            {s.mode === 'test-specific' && <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 font-semibold">Test-specific</span>}
                            {isDup && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold flex items-center gap-1">
                                <Copy className="w-3 h-3" /> {dup.duplicateMatchType === 'exact' ? 'Exact Duplicate' : 'Similar'}
                              </span>
                            )}
                            {s.subject && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{s.subject}</span>}
                            {s.topic && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">{s.topic}</span>}
                          </div>
                          <div className="text-sm font-medium">
                            <QuestionRenderer question={s} showOptions={false} showHeader={false} />
                          </div>
                          {s.validationErrors?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {s.validationErrors.map((v: string, i: number) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{v}</span>
                              ))}
                            </div>
                          )}
                          {dup?.duplicatePreview && (
                            <div className="mt-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Copy className="w-3 h-3" /> Matches existing question</div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{dup.duplicatePreview}</p>
                            </div>
                          )}
                          {s.options?.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                              {s.options.map((o: any) => (
                                <div key={o.key}><strong className="text-foreground">{o.key}:</strong> {o.text}</div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                            <span>Ans: <strong className="text-primary">{s.correctAnswer?.join(', ') || 'N/A'}</strong></span>
                            <span>Diff: {s.difficulty}</span>
                            <span>Lang: {s.language}</span>
                            {s.source && <span>Src: {s.source}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={async () => { try { await api.delete(`/questions/staged/${s._id}`); setMessage('Staged question rejected.'); await loadAll(); } catch (err: any) { setError(err.message); } }}
                          className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </AdminLayout>
  );
}


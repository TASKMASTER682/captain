'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { 
  FileText, CheckCircle2, ShieldAlert, ArrowLeft, 
  Save, Plus, Trash2, Database, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuestionRenderer from '@/components/QuestionRenderer';

export default function QuestionPasteManager() {
  const router = useRouter();
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [unusedCount, setUnusedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadUnusedCount();
  }, [router]);

  const loadUnusedCount = async () => {
    try {
      const res = await api.get('/questions?usageStatus=unused&limit=1');
      setUnusedCount(res.pagination?.total || 0);
    } catch (_e) { /* ignore */ }
  };

  const handleParse = async () => {
    if (!pasteText.trim()) { setError('Paste some questions first.'); return; }
    setError('');
    setParsing(true);
    try {
      const res = await api.post('/questions/paste', { text: pasteText });
      setParsed(res.data || []);
      setSavedCount(res.data?.length || 0);
      setPasteText('');
      await loadUnusedCount();
    } catch (err: any) {
      setError(err.message || 'Parse failed.');
    }
    setParsing(false);
  };

  const handleClear = () => {
    setPasteText('');
    setParsed([]);
    setSavedCount(0);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <FileText className="w-5 h-5 text-emerald-500" />
          <h1 className="font-bold text-lg font-outfit">Question Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> {unusedCount} Unused
          </span>
          <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10">Super Admin</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Total Unused</span>
            <p className="text-2xl font-bold font-outfit text-emerald-500">{unusedCount}</p>
          </div>
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Just Parsed</span>
            <p className="text-2xl font-bold font-outfit text-primary">{savedCount}</p>
          </div>
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Status</span>
            <p className="text-sm font-bold font-outfit text-foreground">{parsed.length > 0 ? 'Ready' : 'Idle'}</p>
          </div>
        </div>

        {/* Paste Area */}
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> Paste Questions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste questions in plain text. The parser extracts question body, options, answer, subject, topic, explanation automatically.
              </p>
            </div>
            <button onClick={handleClear} className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs font-semibold hover:bg-muted">Clear</button>
          </div>

          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
              placeholder={`Paste questions using the structured format below:\n\n[Q] Consider the following statements:\n[ST-START]\nStatement 1 here\nStatement 2 here\n[ST-END]\n[SUB-Q] How many are correct?\n[O_a] Only one\n[O_b] Only two\n[O_c] All three\n[O_d] None\n[ANS] B\n[EXP] Explanation here\n[SUBJ] Polity\n[TOPIC] Constitution\n[TYPE] Conceptual\n[DIFFICULTY] Medium\n[SRC] CGL 2024\n[NEXT]\n\nOr simpler:\n\n[Q] What is the capital of France?\n[SUB-Q] Choose the correct option:\n[O_a] London\n[O_b] Paris\n[O_c] Berlin\n[O_d] Madrid\n[ANS] B\n[EXP] Paris is the capital of France.\n[SUBJ] Geography\n[NEXT]`}
            className="w-full px-5 py-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-64 font-mono text-xs leading-relaxed resize-y"
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={parsing || !pasteText.trim()}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            {parsing ? 'Parsing...' : <><Save className="w-4 h-4" /> Parse & Save as Unused</>}
          </button>
        </div>

        {/* Parsed Results */}
        {parsed.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Parsed Questions ({parsed.length})
            </h2>
            <div className="flex flex-col gap-3">
              {parsed.map((q: any, idx: number) => {
                const hasErrors = q.validationErrors?.length > 0;
                return (
                  <div key={q._id || idx} className={`p-5 rounded-3xl border bg-card ${hasErrors ? 'border-rose-500/20 bg-rose-500/5' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-semibold flex-1">
                        <span className="text-primary font-bold mr-1">{idx + 1}.</span>
                        <QuestionRenderer question={q} showOptions={false} showHeader={false} />
                      </div>
                      {hasErrors ? (
                        <div className="shrink-0 flex items-center gap-1 text-rose-500 text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                          <ShieldAlert className="w-3 h-3" /> {q.validationErrors?.join(' | ')}
                        </div>
                      ) : (
                        <div className="shrink-0 flex items-center gap-1 text-emerald-500 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </div>
                      )}
                    </div>
                    {q.options?.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground pl-5">
                        {q.options.map((o: any) => (
                          <div key={o.key}><strong className="text-foreground">{o.key}:</strong> {o.text}</div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap pl-5">
                      <span>Ans: <strong className="text-primary">{q.correctAnswer?.join(', ') || 'N/A'}</strong></span>
                      {q.subject && <span className="px-2 py-0.5 rounded bg-secondary">{q.subject}</span>}
                      {q.topic && <span className="px-2 py-0.5 rounded bg-secondary">{q.topic}</span>}
                      {q.difficulty && <span>{q.difficulty}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center text-sm text-emerald-600 font-semibold">
              <CheckCircle2 className="w-5 h-5 inline mr-1.5" />
              {savedCount} questions saved as unused. Available for test creation.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Save, X, FilePlus2,
  ClipboardList, Settings, Clock, FileText, HelpCircle, Layers,
  Database, Search, CheckSquare, Eye, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function TestSeriesDetail() {
  const router = useRouter();
  const params = useParams();
  const seriesId = params.id as string;

  const [testSeries, setTestSeries] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder modal state
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingMarks, setPassingMarks] = useState(40);
  const [passingMode, setPassingMode] = useState<'manual' | 'auto'>('manual');
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [calculatorAllowed, setCalculatorAllowed] = useState(false);
  const [fullscreenRequired, setFullscreenRequired] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [scheduled, setScheduled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sections, setSections] = useState<any[]>([
    { name: 'Section 1', duration: 0, negativeMarking: true, marksPerQuestion: 2, negativeMarksPerQuestion: 0.5, questionIds: [] }
  ]);
  const [questionMode, setQuestionMode] = useState<'paste' | 'bank' | 'auto'>('paste');
  const [questionPaste, setQuestionPaste] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-select state
  const [autoSubjects, setAutoSubjects] = useState<string[]>([]);
  const [autoConfigs, setAutoConfigs] = useState<{
    totalQuestions: number;
    usageStatus: string;
    subjects: { name: string; pct: number }[];
    difficulties: { easy: number; medium: number; hard: number };
  }[]>([]);

  // Question bank browser state
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankTotal, setBankTotal] = useState(0);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubject, setBankSubject] = useState('');
  const [bankTopic, setBankTopic] = useState('');
  const [bankDifficulty, setBankDifficulty] = useState('');
  const [bankType, setBankType] = useState('');
  const [bankUsageStatus, setBankUsageStatus] = useState('unused');
  const [bankSubjects, setBankSubjects] = useState<string[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [targetSectionIndex, setTargetSectionIndex] = useState(0);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadData();
  }, [router, seriesId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tsRes, tRes] = await Promise.all([
        api.get(`/test-series/${seriesId}`),
        api.get(`/tests?testSeriesId=${seriesId}&status=`)
      ]);
      setTestSeries(tsRes.data);
      setTests(tRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadBankQuestions = async () => {
    setBankLoading(true);
    try {
      const [subjRes, qRes] = await Promise.all([
        api.get('/questions/subjects').catch(() => ({ data: [] })),
        (async () => {
          const params = new URLSearchParams();
          if (bankSearch) params.set('search', bankSearch);
          if (bankSubject) params.set('subject', bankSubject);
          if (bankTopic) params.set('topic', bankTopic);
          if (bankDifficulty) params.set('difficulty', bankDifficulty);
          if (bankType) params.set('type', bankType);
          if (bankUsageStatus) params.set('usageStatus', bankUsageStatus);
          params.set('limit', '100');
          return await api.get(`/questions?${params.toString()}`);
        })(),
      ]);
      setBankSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      setBankQuestions(qRes.data || []);
      setBankTotal(qRes.pagination?.total || 0);
    } catch (err) { console.error(err); }
    setBankLoading(false);
  };

  useEffect(() => {
    if (showBuilder && questionMode === 'bank') {
      loadBankQuestions();
    }
  }, [showBuilder, questionMode, bankSubject, bankDifficulty, bankType, bankUsageStatus]);

  const openCreate = () => {
    setEditingTest(null);
    setTitle(''); setDuration(60); setPassingMarks(40); setPassingMode('manual'); setAttemptLimit(1);
    setCalculatorAllowed(false); setFullscreenRequired(true);
    setShuffleQuestions(true); setShuffleOptions(true);
    setScheduled(false); setStartTime(''); setEndTime('');
    setSections([{ name: 'Section 1', duration: 0, negativeMarking: true, marksPerQuestion: 2, negativeMarksPerQuestion: 0.5, questionIds: [] }]);
    setQuestionPaste('');
    setQuestionMode('paste');
    setSelectedQuestionIds(new Set());
    setShowBuilder(true);
  };

  const openEdit = (t: any) => {
    setEditingTest(t);
    setTitle(t.title); setDuration(t.duration); setPassingMarks(t.passingMarks); setPassingMode(t.passingMode || 'manual');
    setAttemptLimit(t.attemptLimit);
    setCalculatorAllowed(t.calculatorAllowed); setFullscreenRequired(t.fullscreenRequired);
    setShuffleQuestions(t.shuffleQuestions); setShuffleOptions(t.shuffleOptions);
    setScheduled(!!t.scheduled);
    setStartTime(t.startTime ? new Date(t.startTime).toISOString().slice(0, 16) : '');
    setEndTime(t.endTime ? new Date(t.endTime).toISOString().slice(0, 16) : '');
    setSections(t.sections?.map((s: any) => ({
      name: s.name, duration: s.duration || 0,
      negativeMarking: s.negativeMarking,
      marksPerQuestion: s.marksPerQuestion || 2,
      negativeMarksPerQuestion: s.negativeMarksPerQuestion || 0.5,
      questionIds: s.questions?.map((q: any) => q._id || q) || [],
    })) || []);
    setQuestionPaste('');
    setQuestionMode('bank');
    setSelectedQuestionIds(new Set());
    setShowBuilder(true);
  };

  const handleAddSection = () => {
    setSections([...sections, { name: 'Section ' + (sections.length + 1), duration: 0, negativeMarking: true, marksPerQuestion: 2, negativeMarksPerQuestion: 0.5, questionIds: [] }]);
  };
  const handleRemoveSection = (idx: number) => { setSections(sections.filter((_, i) => i !== idx)); };
  const handleSectionChange = (idx: number, field: string, val: any) => {
    const updated = [...sections]; updated[idx][field] = val; setSections(updated);
  };

  const toggleSelectQuestion = (id: string) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedQuestionIds(next);
  };

  const addSelectedToSection = () => {
    if (selectedQuestionIds.size === 0) return;
    const updated = [...sections];
    const existing = new Set(updated[targetSectionIndex].questionIds);
    selectedQuestionIds.forEach(id => existing.add(id));
    updated[targetSectionIndex] = { ...updated[targetSectionIndex], questionIds: Array.from(existing) };
    setSections(updated);
    setSelectedQuestionIds(new Set());
  };

  const removeQuestionFromSection = (secIdx: number, qId: string) => {
    const updated = [...sections];
    updated[secIdx] = { ...updated[secIdx], questionIds: updated[secIdx].questionIds.filter((id: string) => id !== qId) };
    setSections(updated);
  };

  const initAutoConfigs = () => {
    setAutoConfigs(sections.map(s => ({
      totalQuestions: 10,
      usageStatus: 'unused',
      subjects: autoSubjects.length > 0 ? [{ name: autoSubjects[0], pct: 100 }] : [],
      difficulties: { easy: 30, medium: 50, hard: 20 },
    })));
  };

  // Distributes `total` items across buckets proportionally using largest-remainder method
  const distribute = (total: number, buckets: { pct: number }[]): number[] => {
    if (total === 0) return buckets.map(() => 0);
    const raw = buckets.map(b => total * b.pct / 100);
    const floors = raw.map(v => Math.floor(v));
    const remainders = raw.map((v, i) => ({ idx: i, rem: v - floors[i] }));
    remainders.sort((a, b) => b.rem - a.rem);
    let allocated = floors.reduce((s, v) => s + v, 0);
    const result = [...floors];
    for (const r of remainders) {
      if (allocated >= total) break;
      result[r.idx]++;
      allocated++;
    }
    return result;
  };

  const autoFillSection = async (sectionIdx: number) => {
    const config = autoConfigs[sectionIdx];
    if (!config || config.subjects.length === 0) { alert('Add at least one subject allocation.'); return; }
    const diffTotal = config.difficulties.easy + config.difficulties.medium + config.difficulties.hard;
    if (diffTotal !== 100) { alert('Difficulty percentages must sum to 100%.'); return; }
    const subjPctSum = config.subjects.reduce((a, s) => a + s.pct, 0);
    if (subjPctSum !== 100) { alert(`Subject percentages sum to ${subjPctSum}%, must be 100%.`); return; }

    const pickedIds: string[] = [];
    const pickedSet = new Set<string>();

    // Distribute total questions across subjects using largest remainder
    const subjCounts = distribute(config.totalQuestions, config.subjects);

    const diffBuckets = [
      { pct: config.difficulties.easy, key: 'Easy' },
      { pct: config.difficulties.medium, key: 'Medium' },
      { pct: config.difficulties.hard, key: 'Hard' },
    ];

    for (let si = 0; si < config.subjects.length; si++) {
      const subj = config.subjects[si];
      const qForSubj = subjCounts[si];
      if (qForSubj === 0) continue;

      // Distribute subject questions across difficulties
      const diffCounts = distribute(qForSubj, diffBuckets);

      for (let di = 0; di < diffBuckets.length; di++) {
        const qForDiff = diffCounts[di];
        if (qForDiff === 0) continue;

        const params = new URLSearchParams({ subject: subj.name, difficulty: diffBuckets[di].key, limit: '200' });
        if (config.usageStatus) params.set('usageStatus', config.usageStatus);
        const res = await api.get(`/questions?${params.toString()}`).catch(() => ({ data: [] }));
        const candidates = (res.data || []).filter((q: any) => !pickedSet.has(q._id));

        const shuffled = candidates.sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, qForDiff);
        picked.forEach((q: any) => { pickedIds.push(q._id); pickedSet.add(q._id); });
      }
    }

    // Fallback: fill remaining slots from any unfiltered pool
    if (pickedIds.length < config.totalQuestions) {
      const remaining = config.totalQuestions - pickedIds.length;
      const params = new URLSearchParams({ limit: '200' });
      if (config.usageStatus) params.set('usageStatus', config.usageStatus);
      const res = await api.get(`/questions?${params.toString()}`).catch(() => ({ data: [] }));
      const candidates = (res.data || []).filter((q: any) => !pickedSet.has(q._id));
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, remaining);
      picked.forEach((q: any) => { pickedIds.push(q._id); pickedSet.add(q._id); });
    }

    const updated = [...sections];
    updated[sectionIdx] = { ...updated[sectionIdx], questionIds: pickedIds };
    setSections(updated);
  };

  const handleSaveTest = async () => {
    if (!title) { alert('Test title is required.'); return; }
    setSaving(true);
    try {
      // If paste mode has text, parse it and add IDs to sections
      let finalSections = sections;
      if (questionMode === 'paste' && questionPaste.trim()) {
        const parseRes = await api.post('/questions/paste', { text: questionPaste });
        const newQuestions = parseRes.data || [];
        if (newQuestions.length > 0) {
          finalSections = sections.map((s, i) => {
            if (i === 0) {
              const existing = new Set(s.questionIds || []);
              newQuestions.forEach((q: any) => existing.add(q._id));
              return { ...s, questionIds: Array.from(existing) };
            }
            return s;
          });
        }
      }

      const payload = {
        testSeriesId: seriesId,
        examId: testSeries?.examId?._id || testSeries?.examId,
        title, duration, passingMarks, passingMode, attemptLimit,
        calculatorAllowed, fullscreenRequired, shuffleQuestions, shuffleOptions,
        scheduled, startTime: scheduled && startTime ? new Date(startTime).toISOString() : null,
        endTime: scheduled && endTime ? new Date(endTime).toISOString() : null,
        sections: finalSections.map(s => ({
          name: s.name, duration: s.duration,
          negativeMarking: s.negativeMarking,
          marksPerQuestion: s.marksPerQuestion || 2,
          negativeMarksPerQuestion: s.negativeMarksPerQuestion || 0.5,
          questions: s.questionIds || [],
        })),
        status: 'Published',
      };

      if (editingTest) { await api.put(`/tests/${editingTest._id}`, payload); }
      else { await api.post('/tests', payload); }

      setShowBuilder(false);
      await loadData();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleDeleteTest = (id: string) => {
    setDeletingTestId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteTest = async (deleteQuestions: boolean) => {
    if (!deletingTestId) return;
    try {
      if (deleteQuestions) {
        const detail = await api.get(`/tests/${deletingTestId}`);
        const test = detail.data?.test || detail.data;
        const qIds = (test?.sections || []).flatMap((s: any) =>
          (s.questions || []).map((q: any) => typeof q === 'string' ? q : q?._id).filter(Boolean)
        );
        await api.delete(`/tests/${deletingTestId}`);
        if (qIds.length) {
          await api.post('/questions/bulk-delete', { ids: qIds, hardDelete: true });
        }
      } else {
        await api.delete(`/tests/${deletingTestId}`);
      }
      await loadData();
    } catch (err: any) { alert(err.message); }
    setShowDeleteModal(false);
    setDeletingTestId(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;
  }
  if (!testSeries) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Test Series not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/test-series" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Layers className="w-5 h-5 text-orange-500" />
          <div>
            <h1 className="font-bold text-lg font-outfit">{testSeries.title}</h1>
            <p className="text-[10px] text-muted-foreground">{testSeries.examId?.name || 'N/A'} — {tests.length} test(s)</p>
          </div>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Test
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {tests.length === 0 ? (
          <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No tests in this series yet.</p>
            <p className="text-xs mt-1">Click "New Test" above to create one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tests.map((t: any) => (
              <div key={t._id} className="p-6 rounded-3xl border border-border bg-card hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{t.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{t.status}</span>
                      {t.scheduled && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-500">
                          Scheduled {t.startTime ? `· ${new Date(t.startTime).toLocaleString()}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t.duration} min</span>
                      <span>Pass: {t.passingMode === 'auto' ? 'Auto (Merit)' : `${t.passingMarks}%`}</span>
                      <span>Attempts: {t.attemptLimit || '∞'}</span>
                      <span>Sections: {t.sections?.length || 0}</span>
                      <span>Total Qs: {t.sections?.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || 0}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {t.fullscreenRequired && <span className="px-2 py-0.5 rounded bg-secondary">Fullscreen Lock</span>}
                      {t.shuffleQuestions && <span className="px-2 py-0.5 rounded bg-secondary">Shuffle Qs</span>}
                      {t.shuffleOptions && <span className="px-2 py-0.5 rounded bg-secondary">Shuffle Options</span>}
                      {t.calculatorAllowed && <span className="px-2 py-0.5 rounded bg-secondary">Calculator</span>}
                    </div>
                    {t.sections?.map((s: any, i: number) => (
                      <div key={i} className="mt-2 text-[10px] text-muted-foreground flex items-center gap-2">
                        <span className="font-semibold text-foreground">{s.name}:</span>
                        <span>{s.questions?.length || 0} questions</span>
                        {s.negativeMarking && <span className="text-rose-500">-{s.negativeMarksPerQuestion || 0.5} per wrong</span>}
                        {s.marksPerQuestion && <span>+{s.marksPerQuestion} per correct</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => window.open(`/cbt/${t._id}?preview=1`, '_blank')} className="p-2 rounded-xl bg-secondary text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors" title="Preview as Candidate"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(t)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors" title="Edit Test"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteTest(t._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl border border-border shadow-2xl flex flex-col gap-5">
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Delete Test?
            </h3>
            <p className="text-sm text-muted-foreground">
              Also delete all questions linked to this test from the database?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowDeleteModal(false); setDeletingTestId(null); }} className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-semibold">Cancel</button>
              <button onClick={() => confirmDeleteTest(false)} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-sm font-semibold transition-colors">Delete Test Only</button>
              <button onClick={() => confirmDeleteTest(true)} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">Delete Test & Questions</button>
            </div>
          </div>
        </div>
      )}

      {/* Visual CBT Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-primary" />
                {editingTest ? 'Edit Test' : 'New Test'} — {testSeries.title}
              </h3>
              <button onClick={() => setShowBuilder(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>

            {/* Test Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Test Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mock Test 1" className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Duration (minutes)</label>
                <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Passing Requirement</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={passingMarks} onChange={e => setPassingMarks(Number(e.target.value))} disabled={passingMode === 'auto'}
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
                        passingMode === 'auto'
                          ? 'border-border/40 bg-background/50 text-muted-foreground cursor-not-allowed'
                          : 'border-border bg-background focus:ring-2 focus:ring-primary/20'
                      }`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">%</span>
                  </div>
                  <button onClick={() => setPassingMode(passingMode === 'manual' ? 'auto' : 'manual')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                      passingMode === 'auto'
                        ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                        : 'bg-border/40 text-muted-foreground border-border hover:bg-border'
                    }`}>
                    {passingMode === 'auto' ? 'Auto' : 'Manual'}
                  </button>
                </div>
                {passingMode === 'auto' && <p className="text-[10px] text-indigo-500 mt-1">Passing decided by merit/rank automatically</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Attempt Limit (0 = Unlimited)</label>
                <input type="number" value={attemptLimit} onChange={e => setAttemptLimit(Number(e.target.value))} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>

            {/* Exam Rules */}
            <div className="p-5 rounded-2xl border border-border bg-background">
              <h4 className="text-sm font-bold font-outfit flex items-center gap-2 mb-3"><Settings className="w-4 h-4 text-indigo-500" /> Exam Rules</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer text-xs font-semibold">
                  <span>Lock fullscreen</span>
                  <input type="checkbox" checked={fullscreenRequired} onChange={e => setFullscreenRequired(e.target.checked)} className="rounded border-border text-primary" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer text-xs font-semibold">
                  <span>Calculator allowed</span>
                  <input type="checkbox" checked={calculatorAllowed} onChange={e => setCalculatorAllowed(e.target.checked)} className="rounded border-border text-primary" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer text-xs font-semibold">
                  <span>Shuffle questions</span>
                  <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="rounded border-border text-primary" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer text-xs font-semibold">
                  <span>Shuffle options</span>
                  <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="rounded border-border text-primary" />
                </label>
              </div>
            </div>

            {/* Scheduling */}
            <div className="p-5 rounded-2xl border border-border bg-background">
              <h4 className="text-sm font-bold font-outfit flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-emerald-500" /> Schedule (Live / Fixed-Slot Test)</h4>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer text-xs font-semibold mb-3">
                <span>Enable fixed-slot scheduling</span>
                <input type="checkbox" checked={scheduled} onChange={e => setScheduled(e.target.checked)} className="rounded border-border text-primary" />
              </label>
              {scheduled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">Opens At</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="px-4 py-3 rounded-xl border border-border bg-card text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">Closes At</label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="px-4 py-3 rounded-xl border border-border bg-card text-sm" />
                  </div>
                </div>
              )}
              {scheduled && !startTime && <p className="text-[10px] text-amber-500 mt-2">Students can only start within the window. Leave "Closes At" empty for no end limit.</p>}
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold font-outfit flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500" /> Test Sections</h4>
                <button onClick={handleAddSection} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1 hover:bg-primary/20"><Plus className="w-3.5 h-3.5" /> Add Section</button>
              </div>
              {sections.map((sec, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-border bg-background relative">
                  {sections.length > 1 && (
                    <button onClick={() => handleRemoveSection(idx)} className="absolute top-3 right-3 p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 className="w-3 h-3" /></button>
                  )}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Name</label>
                      <input type="text" value={sec.name} onChange={e => handleSectionChange(idx, 'name', e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Marks per Q</label>
                      <input type="number" value={sec.marksPerQuestion} onChange={e => handleSectionChange(idx, 'marksPerQuestion', Number(e.target.value))} className="px-3 py-2 rounded-lg border border-border bg-card text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Negative / Q</label>
                      <input type="number" value={sec.negativeMarksPerQuestion} onChange={e => handleSectionChange(idx, 'negativeMarksPerQuestion', Number(e.target.value))} className="px-3 py-2 rounded-lg border border-border bg-card text-xs" />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                        <input type="checkbox" checked={sec.negativeMarking} onChange={e => handleSectionChange(idx, 'negativeMarking', e.target.checked)} className="rounded border-border text-primary" />
                        Negative
                      </label>
                    </div>
                  </div>
                  {/* Show assigned questions in section */}
                  {sec.questionIds?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Assigned Questions ({sec.questionIds.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {sec.questionIds.map((qId: string) => (
                          <span key={qId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/5 text-[10px] text-primary font-mono">
                            ...{qId.slice(-6)}
                            <button onClick={() => removeQuestionFromSection(idx, qId)} className="text-rose-500 hover:text-rose-700"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Question Mode Tabs */}
            <div className="flex gap-2 border-b border-border pb-3">
              <button onClick={() => setQuestionMode('paste')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${questionMode === 'paste' ? 'bg-emerald-600 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Paste
              </button>
              <button onClick={() => { setQuestionMode('bank'); loadBankQuestions(); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${questionMode === 'bank' ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                <Database className="w-3.5 h-3.5 inline mr-1" /> Bank
              </button>
              <button onClick={async () => {
                setQuestionMode('auto');
                const subjRes = await api.get('/questions/subjects').catch(() => ({ data: [] }));
                const subs = Array.isArray(subjRes.data) ? subjRes.data : [];
                setAutoSubjects(subs);
                setAutoConfigs(sections.map(s => ({
                  totalQuestions: 10,
                  usageStatus: 'unused',
                  subjects: subs.length > 0 ? [{ name: subs[0], pct: 100 }] : [],
                  difficulties: { easy: 30, medium: 50, hard: 20 },
                })));
              }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${questionMode === 'auto' ? 'bg-violet-600 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Auto Select
              </button>
            </div>

            {/* Paste Questions Tab */}
            {questionMode === 'paste' && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-muted-foreground">Paste questions using the structured format. On save, they are parsed and added to the first section.</p>
                <textarea value={questionPaste} onChange={e => setQuestionPaste(e.target.value)}
                  placeholder={`[Q] What is the chemical symbol for Gold?\n[SUB-Q] Choose the correct option:\n[O_a] Go\n[O_b] Gd\n[O_c] Au\n[O_d] Ag\n[ANS] C\n[EXP] Au is from Latin "Aurum".\n[SUBJ] Science Technology\n[TOPIC] Chemistry\n[TYPE] Conceptual\n[DIFFICULTY] Easy\n[NEXT]`}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-28 font-mono text-xs" />
              </div>
            )}

            {/* Select from Bank Tab */}
            {questionMode === 'bank' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Search</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Search body text..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Subject</label>
                    <select value={bankSubject} onChange={e => setBankSubject(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none cursor-pointer">
                      <option value="">All Subjects</option>
                      {bankSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Topic</label>
                    <input type="text" value={bankTopic} onChange={e => setBankTopic(e.target.value)} placeholder="e.g. Profit & Loss"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Type</label>
                    <select value={bankType} onChange={e => setBankType(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none cursor-pointer">
                      <option value="">All Types</option>
                      <option value="Single Correct">Single Correct</option>
                      <option value="Multiple Correct">Multiple Correct</option>
                      <option value="Numerical">Numerical</option>
                      <option value="Data Sufficiency">Data Sufficiency</option>
                      <option value="Assertion Reason">Assertion Reason</option>
                      <option value="Match the Following">Match the Following</option>
                      <option value="True False">True False</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Difficulty</label>
                    <select value={bankDifficulty} onChange={e => setBankDifficulty(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none cursor-pointer">
                      <option value="">All</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Status</label>
                    <select value={bankUsageStatus} onChange={e => setBankUsageStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none cursor-pointer">
                      <option value="unused">Unused</option>
                      <option value="">All</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-muted-foreground">Target Section</label>
                    <select value={targetSectionIndex} onChange={e => setTargetSectionIndex(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none cursor-pointer">
                      {sections.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end min-w-[60px]">
                    <button onClick={loadBankQuestions} className="w-full px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 flex items-center justify-center gap-1">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="font-semibold">{bankTotal} question{bankTotal !== 1 ? 's' : ''} found</span>
                  <button onClick={addSelectedToSection} disabled={selectedQuestionIds.size === 0}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-primary/20">
                    <Plus className="w-3.5 h-3.5" /> Add {selectedQuestionIds.size > 0 ? `(${selectedQuestionIds.size}) ` : ''}to {sections[targetSectionIndex]?.name}
                  </button>
                </div>

                {bankLoading ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">Loading questions...</div>
                ) : bankQuestions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-card/50 text-xs text-muted-foreground">
                    <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No questions match your filters</p>
                    <p className="mt-1">Try adjusting filters or paste new questions in Question Manager.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto border rounded-2xl p-2 bg-background/50">
                    {bankQuestions.map((q: any) => {
                      const isSelected = selectedQuestionIds.has(q._id);
                      const isAssigned = sections.some((s: any) => s.questionIds?.includes(q._id));
                      return (
                        <div key={q._id} className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isSelected ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.03]' :
                          isAssigned ? 'border-emerald-500/30 bg-emerald-500/[0.03] opacity-60' :
                          'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                        }`}
                          onClick={() => { if (!isAssigned) toggleSelectQuestion(q._id); }}>
                          <input type="checkbox" checked={isSelected} readOnly
                            className="mt-0.5 rounded border-border text-primary cursor-pointer shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold leading-relaxed line-clamp-2">{q.body?.split('\n')[0] || '(no body)'}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {q.subject && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{q.subject}</span>}
                              {q.topic && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{q.topic}</span>}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' :
                                q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                              }`}>{q.difficulty || 'N/A'}</span>
                              {q.type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">{q.type}</span>}
                              <span className="text-[10px] text-muted-foreground">+{q.marks ?? 1}</span>
                              {isAssigned && <span className="text-[10px] text-emerald-500 font-semibold">Already in test</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auto Select Tab */}
            {questionMode === 'auto' && (
              <div className="flex flex-col gap-4">
                {autoConfigs.map((cfg, secIdx) => {
                  const sec = sections[secIdx];
                  if (!sec) return null;
                  const subjSum = cfg.subjects.reduce((a, s) => a + s.pct, 0);
                  return (
                    <div key={secIdx} className="p-4 rounded-2xl border border-border bg-background">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-bold font-outfit">{sec.name}</h5>
                        <span className="text-xs text-muted-foreground">Assigned: {sec.questionIds.length}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-muted-foreground">Total Questions</label>
                          <input type="number" min={1} value={cfg.totalQuestions}
                            onChange={e => {
                              const upd = [...autoConfigs]; upd[secIdx] = { ...upd[secIdx], totalQuestions: Math.max(1, Number(e.target.value)) }; setAutoConfigs(upd);
                            }}
                            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-muted-foreground">Usage</label>
                          <select value={cfg.usageStatus} onChange={e => { const upd = [...autoConfigs]; upd[secIdx] = { ...upd[secIdx], usageStatus: e.target.value }; setAutoConfigs(upd); }}
                            className="px-3 py-2 rounded-xl border border-border bg-card text-xs outline-none cursor-pointer">
                            <option value="unused">Unused</option>
                            <option value="">All</option>
                            <option value="used">Used</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground">Difficulty Split (%)</label>
                          <div className="flex gap-2 items-center">
                            <input type="number" min={0} max={100} value={cfg.difficulties.easy}
                              onChange={e => { const v = Math.max(0, Math.min(100, Number(e.target.value))); const upd = [...autoConfigs]; upd[secIdx] = { ...upd[secIdx], difficulties: { ...upd[secIdx].difficulties, easy: v } }; setAutoConfigs(upd); }}
                              className="w-full px-2 py-2 rounded-xl border border-border bg-card text-xs text-center outline-none focus:ring-2 focus:ring-primary/20" />
                            <span className="text-[10px] text-emerald-500 font-bold w-8">Easy</span>
                            <input type="number" min={0} max={100} value={cfg.difficulties.medium}
                              onChange={e => { const v = Math.max(0, Math.min(100, Number(e.target.value))); const upd = [...autoConfigs]; upd[secIdx] = { ...upd[secIdx], difficulties: { ...upd[secIdx].difficulties, medium: v } }; setAutoConfigs(upd); }}
                              className="w-full px-2 py-2 rounded-xl border border-border bg-card text-xs text-center outline-none focus:ring-2 focus:ring-primary/20" />
                            <span className="text-[10px] text-amber-500 font-bold w-10">Med.</span>
                            <input type="number" min={0} max={100} value={cfg.difficulties.hard}
                              onChange={e => { const v = Math.max(0, Math.min(100, Number(e.target.value))); const upd = [...autoConfigs]; upd[secIdx] = { ...upd[secIdx], difficulties: { ...upd[secIdx].difficulties, hard: v } }; setAutoConfigs(upd); }}
                              className="w-full px-2 py-2 rounded-xl border border-border bg-card text-xs text-center outline-none focus:ring-2 focus:ring-primary/20" />
                            <span className="text-[10px] text-rose-500 font-bold w-8">Hard</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Subject Allocation</label>
                        <div className="flex flex-wrap gap-2">
                          {autoSubjects.map(sub => {
                            const alloc = cfg.subjects.find(s => s.name === sub);
                            return (
                              <label key={sub} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${alloc ? 'border-primary/40 bg-primary/[0.04] text-foreground' : 'border-border bg-card text-muted-foreground hover:border-border/60'}`}>
                                <input type="checkbox" checked={!!alloc}
                                  onChange={() => {
                                    const upd = [...autoConfigs];
                                    const list = [...upd[secIdx].subjects];
                                    if (alloc) { upd[secIdx] = { ...upd[secIdx], subjects: list.filter(s => s.name !== sub) }; }
                                    else { upd[secIdx] = { ...upd[secIdx], subjects: [...list, { name: sub, pct: 0 }] }; }
                                    setAutoConfigs(upd);
                                  }} className="rounded border-border text-primary" />
                                {sub}
                                {alloc && (
                                  <input type="number" min={0} max={100} value={alloc.pct}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => {
                                      const upd = [...autoConfigs];
                                      const list = [...upd[secIdx].subjects];
                                      const idx = list.findIndex(s => s.name === sub);
                                      if (idx !== -1) { list[idx] = { ...list[idx], pct: Math.max(0, Math.min(100, Number(e.target.value))) }; upd[secIdx] = { ...upd[secIdx], subjects: list }; setAutoConfigs(upd); }
                                    }}
                                    className="w-12 px-1 py-0.5 rounded border border-border/60 bg-card text-xs text-center outline-none" />)
                                }
                              </label>
                            );
                          })}
                        </div>
                        {subjSum > 0 && subjSum !== 100 && (
                          <p className="text-[10px] text-rose-500 mt-1">Subject percentages sum to {subjSum}% (should be 100%)</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => autoFillSection(secIdx)}
                          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 flex items-center gap-1.5 shadow-sm shadow-violet-600/20">
                          <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Section
                        </button>
                        <button onClick={() => {
                          const updated = [...sections];
                          updated[secIdx] = { ...updated[secIdx], questionIds: [] };
                          setSections(updated);
                        }} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted">
                          Clear
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => setShowBuilder(false)} className="py-3.5 rounded-xl border border-border hover:bg-muted font-semibold text-sm">Cancel</button>
              <button onClick={handleSaveTest} disabled={saving} className="py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-sm flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

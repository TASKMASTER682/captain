'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthUser } from '@/lib/api';
import PublicHeader from '@/components/PublicHeader';
import {
  Loader2, Play, BookOpen, Clock, Hash, ChevronDown,
  AlertTriangle, GraduationCap, Sparkles, Building2, Search,
  Lock, Crown, CreditCard, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function CustomTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(15);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [agencySearch, setAgencySearch] = useState('');
  const [examSearch, setExamSearch] = useState('');

  // Check access then load setup
  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push('/login?mode=signup&redirect=/custom-test'); return; }
    checkAccess();
  }, [router]);

  const checkAccess = async () => {
    try {
      const res = await api.get('/custom-tests/access');
      if (res.data.hasAccess) {
        setHasAccess(true);
        loadSetup();
      } else {
        setHasAccess(false);
        setLoading(false);
      }
    } catch {
      setHasAccess(false);
      setLoading(false);
    }
  };

  const loadSetup = async () => {
    setLoading(true);
    try {
      const res = await api.get('/custom-tests/setup');
      setAgencies(res.data.agencies || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load setup data.');
    }
    setLoading(false);
  };

  // When agency changes → load exams for that agency
  const loadExams = useCallback(async (agencyId: string) => {
    setExams([]);
    setSelectedExam('');
    setSubjects([]);
    setSelectedSubject('');
    if (!agencyId) return;
    try {
      const res = await api.get(`/custom-tests/setup?agencyId=${agencyId}`);
      setExams(res.data.exams || []);
    } catch {}
  }, []);

  // When exam changes → load subjects for that exam
  const loadSubjects = useCallback(async (examId: string) => {
    setSubjects([]);
    setSelectedSubject('');
    if (!examId) return;
    try {
      const res = await api.get(`/custom-tests/setup?examId=${examId}`);
      setSubjects(res.data.subjects || []);
    } catch {}
  }, []);

  useEffect(() => { loadExams(selectedAgency); }, [selectedAgency, loadExams]);
  useEffect(() => { loadSubjects(selectedExam); }, [selectedExam, loadSubjects]);

  const filteredAgencies = agencies.filter((a) =>
    !agencySearch || a.name.toLowerCase().includes(agencySearch.toLowerCase()) || (a.code || '').toLowerCase().includes(agencySearch.toLowerCase())
  );

  const filteredExams = exams.filter((e) =>
    !examSearch || e.name.toLowerCase().includes(examSearch.toLowerCase()) || (e.code || '').toLowerCase().includes(examSearch.toLowerCase())
  );

  const canStart = selectedAgency && selectedExam && selectedSubject && questionCount > 0 && timeMinutes > 0;

  const handleStart = async () => {
    if (!canStart || creating) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.post('/custom-tests/create', {
        examId: selectedExam,
        subject: selectedSubject,
        count: questionCount,
        timeMinutes,
      });
      const testData = res.data;
      localStorage.setItem('custom-test-config', JSON.stringify({
        ...testData,
        timeMinutes,
      }));
      router.push('/custom-test/take');
    } catch (err: any) {
      setError(err.message || 'Failed to create test. Try different options.');
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Access gate — show upgrade prompt if user hasn't bought anything
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <PublicHeader />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-16 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Premium Feature</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Custom Test creation is available for users who have purchased a <strong>Test Series</strong> or a <strong>Premium Pack</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link
              href="/test-series"
              className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Buy Test Series
            </Link>
            <Link
              href="/plans"
              className="flex-1 py-3.5 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-all border border-border flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" /> View Plans
            </Link>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-2"
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Practice Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Create Your Own Test</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Pick an agency, exam, and subject — then start practising. Questions are randomly
            selected from Easy and Medium difficulty.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card space-y-5 shadow-sm">

          {/* Step 1: Agency Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Step 1 — Select Agency
            </label>
            {agencies.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">No agencies found. Contact admin to enroll you.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={agencySearch}
                    onChange={(e) => { setAgencySearch(e.target.value); }}
                    placeholder="Search agencies…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filteredAgencies.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => { setSelectedAgency(a._id); setAgencySearch(''); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedAgency === a._id
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {a.name}{a.code ? ` (${a.code})` : ''}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Step 2: Exam Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Step 2 — Select Exam
            </label>
            {!selectedAgency ? (
              <p className="text-xs text-muted-foreground italic px-1">Select an agency first.</p>
            ) : exams.length === 0 ? (
              <p className="text-xs text-amber-500 italic px-1">No exams found for this agency.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => { setExamSearch(e.target.value); }}
                    placeholder="Search exams…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filteredExams.map((e) => (
                    <button
                      key={e._id}
                      onClick={() => { setSelectedExam(e._id); setExamSearch(''); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedExam === e._id
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {e.name}{e.code ? ` (${e.code})` : ''}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Step 3: Subject Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Step 3 — Select Subject
            </label>
            {!selectedExam ? (
              <p className="text-xs text-muted-foreground italic px-1">Select an exam first.</p>
            ) : subjects.length === 0 ? (
              <p className="text-xs text-amber-500 italic px-1">No subjects found for this exam.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedSubject === s
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Number of Questions
            </label>
            <div className="flex items-center gap-3">
              {[10, 15, 20, 25, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    questionCount === n
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time Limit (minutes)
            </label>
            <div className="flex items-center gap-3">
              {[10, 15, 20, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setTimeMinutes(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    timeMinutes === m
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="text-rose-600">{error}</span>
          </div>
        )}

        {/* Summary + Start */}
        {canStart && (
          <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Test Summary</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>Agency: <strong>{agencies.find((a) => a._id === selectedAgency)?.name}</strong></span>
              <span>Exam: <strong>{exams.find((e) => e._id === selectedExam)?.name}</strong></span>
              <span>Subject: <strong>{selectedSubject}</strong></span>
              <span><strong>{questionCount}</strong> questions</span>
              <span>Time: <strong>{timeMinutes} min</strong></span>
              <span>Difficulty: <strong>Easy + Medium</strong></span>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || creating}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {creating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Creating Test…</>
          ) : (
            <><Play className="w-5 h-5" /> Start Test</>
          )}
        </button>

        <p className="text-center text-[10px] text-muted-foreground">
          Questions are randomly picked each time. Results are shown immediately and not saved.
        </p>
      </main>
    </div>
  );
}

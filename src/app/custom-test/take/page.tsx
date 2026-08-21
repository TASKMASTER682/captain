'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthUser } from '@/lib/api';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Clock, Check, X,
  BarChart3, Target, Timer, Percent, ArrowLeft, Trophy,
} from 'lucide-react';
import QuestionRenderer from '@/components/QuestionRenderer';

export default function CustomTestTake() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load config from localStorage
  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push('/login?mode=signup&redirect=/custom-test'); return; }

    const raw = localStorage.getItem('custom-test-config');
    if (!raw) { router.push('/custom-test'); return; }
    try {
      const cfg = JSON.parse(raw);
      setConfig(cfg);
      setTimeLeft((cfg.timeMinutes || 30) * 60);
      startTimeRef.current = Date.now();
    } catch { router.push('/custom-test'); }
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!config || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [config, submitted]);

  const questions = config?.questions || [];
  const totalQ = questions.length;
  const currentQ = questions[currentIndex];

  const answeredCount = Object.values(selectedAnswers).filter((a) => a.length > 0).length;

  const handleOptionClick = (key: string) => {
    const qType = currentQ?.type;
    let next: string[];
    if (qType === 'Multiple Correct') {
      const cur = selectedAnswers[currentIndex] || [];
      next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    } else {
      next = [key];
    }
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: next }));
  };

  const handleClear = () => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: [] }));
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const answersPayload = questions.map((q: any, idx: number) => ({
      questionId: q._id,
      selectedAnswer: selectedAnswers[idx] || [],
    }));

    try {
      const res = await api.post('/custom-tests/submit', {
        examId: config.examId,
        subject: config.subject,
        timeMinutes: config.timeMinutes,
        timeTakenSeconds,
        answers: answersPayload,
      });
      setReport(res.data);
      setSubmitted(true);
      localStorage.removeItem('custom-test-config');
    } catch (err: any) {
      alert(err.message || 'Failed to submit. Please try again.');
      setSubmitting(false);
      // Timer keeps running via the existing useEffect — user can retry manually.
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Loading / redirect
  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  // ─── REPORT CARD ───────────────────────────────────────────────────────────────
  if (submitted && report) {
    const isPassed = report.percentage >= 40;
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <header className="sticky top-0 z-50 glass border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/custom-test')} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-lg font-outfit">Test Results</h1>
              <p className="text-[10px] text-muted-foreground">{config.subject} · {config.examName}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-8 flex flex-col items-center gap-6">
          {/* Score Circle */}
          <div className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center border-4 ${
            isPassed ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5'
          }`}>
            <Trophy className={`w-8 h-8 mb-1 ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`} />
            <span className="text-3xl font-extrabold font-outfit">{report.percentage}%</span>
            <span className={`text-xs font-bold ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPassed ? 'Passed' : 'Keep Practising'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <StatCard icon={BarChart3} label="Total Marks" value={`${report.totalMarks} / ${report.maxMarks}`} color="text-primary bg-primary/10" />
            <StatCard icon={Target} label="Accuracy" value={`${report.accuracy}%`} color="text-sky-500 bg-sky-500/10" />
            <StatCard icon={Timer} label="Time Taken" value={formatTime(report.timeTaken)} color="text-amber-500 bg-amber-500/10" />
            <StatCard icon={Percent} label="Correct" value={`${report.correct} / ${report.totalQuestions}`} color="text-emerald-500 bg-emerald-500/10" />
          </div>

          {/* Breakdown */}
          <div className="w-full p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Breakdown</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-emerald-500 font-semibold">Correct</span><span className="font-bold">{report.correct}</span></div>
              <div className="flex justify-between"><span className="text-rose-500 font-semibold">Incorrect</span><span className="font-bold">{report.incorrect}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Unattempted</span><span className="font-bold">{report.unattempted}</span></div>
            </div>
          </div>

          {/* Retry */}
          <button
            onClick={() => router.push('/custom-test')}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-all shadow-lg shadow-primary/25"
          >
            Create Another Test
          </button>

          <p className="text-[10px] text-muted-foreground text-center">This result was shown once and not saved to your profile.</p>
        </main>
      </div>
    );
  }

  // ─── CBT INTERFACE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">

      {/* Header */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.examName}</span>
          <h1 className="text-sm font-bold font-outfit leading-tight mt-0.5 truncate">{config.subject} Practice Test</h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="font-semibold">{answeredCount}/{totalQ}</span> answered
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm border ${
            timeLeft < 60 ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-slate-800/50 text-slate-200 border-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors text-xs shadow-md shadow-emerald-500/20"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">

        {/* Question Pane */}
        <div className="lg:col-span-3 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-8 gap-5">
          {!currentQ ? (
            <div className="p-8 text-center text-muted-foreground text-sm border border-border rounded-3xl bg-card">Loading question…</div>
          ) : (
            <>
              <div className="flex justify-end items-center text-xs text-muted-foreground gap-4">
                <span className="text-emerald-500 font-semibold">+{currentQ.marks ?? 1}</span>
                <span className="text-rose-500 font-semibold">-{currentQ.negativeMarks ?? 0}</span>
              </div>

              <div className="bg-card p-5 sm:p-6 rounded-3xl border border-border">
                <span className="font-bold text-primary mr-2 font-outfit">Q{currentIndex + 1}.</span>
                <QuestionRenderer question={currentQ} showOptions={false} showHeader={false} />
              </div>

              <div className="flex flex-col gap-3">
                {currentQ.options?.length ? (
                  currentQ.options.map((opt: any) => {
                    const isSelected = (selectedAnswers[currentIndex] || []).includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleOptionClick(opt.key)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
                            : 'bg-card border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm transition-all shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {opt.key}
                        </div>
                        <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>{opt.text}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-3xl border border-border bg-card text-center text-sm text-muted-foreground">No options available.</div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 pt-5 border-t border-border">
                <button
                  onClick={handleClear}
                  className="px-5 py-3 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
                >
                  Clear
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="px-4 py-3 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 inline" /> Prev
                  </button>
                  <button
                    onClick={() => currentIndex < totalQ - 1 && setCurrentIndex(currentIndex + 1)}
                    disabled={currentIndex === totalQ - 1}
                    className="px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/95 text-sm font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-40"
                  >
                    Next <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar — question palette */}
        <div className="border-l border-border bg-secondary/20 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Questions</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q: any, idx: number) => {
                const ans = selectedAnswers[idx];
                const hasAnswer = ans && ans.length > 0;
                return (
                  <button
                    key={q._id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                      hasAnswer
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    } ${currentIndex === idx ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 border-t border-border bg-card grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-500" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-card border border-border" />
              <span>Unanswered ({totalQ - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center gap-4">
            <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-outfit">Submit Test?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have answered <strong>{answeredCount}</strong> out of <strong>{totalQ}</strong> questions.
              Once submitted, results are shown once and cannot be revisited.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="py-3 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => { setShowSubmitModal(false); handleSubmit(); }}
                disabled={submitting}
                className="py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all text-sm shadow-md shadow-emerald-500/20 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat card helper
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-bold font-outfit leading-tight">{value}</div>
        <div className="text-[10px] text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

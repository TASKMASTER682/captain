'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api, getAuthUser } from '@/lib/api';
import { 
  AlertTriangle, Check, ChevronLeft, ChevronRight, ChevronsLeft,
  HelpCircle, Monitor, Wifi, WifiOff, X, Eye, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QuestionRenderer from '@/components/QuestionRenderer';

export default function CbtEngine() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CBT Active States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number[]>([]); // per-section remaining seconds
  const [cbtUser, setCbtUser] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');
  
  // Submit Warning Dialog State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Timer Reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keeps the currently viewed question index available to the 1s timer
  const currentIndexRef = useRef(0);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Tracks whether an auto-submit is waiting to retry once the connection is back
  const pendingSubmitRef = useRef(false);

  // Ref for fullscreen auto-submit (avoids stale closures in event listener)
  const fsCtxRef = useRef({ test: null as any, isPreview: false, attempt: null as any, autoSubmit: async () => {} });
  useEffect(() => { fsCtxRef.current = { test, isPreview, attempt, autoSubmit: handleAutoSubmit }; });

  // Check if preview mode
  useEffect(() => {
    setIsPreview(new URLSearchParams(window.location.search).get('preview') === '1');
  }, []);

  // Fetch Test & Initialize Attempt
  useEffect(() => {
    setCbtUser(getAuthUser());
    const initializeCbt = async () => {
      try {
        const testRes = await api.get(`/tests/${testId}`);
        setTest(testRes.data);

        // Preview mode — skip attempt, just show questions
        if (new URLSearchParams(window.location.search).get('preview') === '1') {
          setLoading(false);
          return;
        }

        // Start attempt session
        const attemptRes = await api.post('/attempts/start', { testId });
        const attemptData = attemptRes.data;
        setAttempt(attemptData);
        setTimeLeft(attemptData.remainingSeconds);

        // Initialize per-section timers
        const secTimes = (testRes.data.sections || []).map((sec: any) => {
          if (sec.duration > 0) return sec.duration * 60;
          return 0; // no limit
        });
        if (attemptData.sectionTimeLeft && attemptData.sectionTimeLeft.length === secTimes.length) {
          setSectionTimeLeft(attemptData.sectionTimeLeft);
        } else {
          setSectionTimeLeft(secTimes);
        }

        // Find index of first not-answered question
        const firstUnanswered = attemptData.answers.findIndex((ans: any) => ans.status === 'Not Visited');
        setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);

        // Load pre-selected answer
        const currentAns = attemptData.answers[firstUnanswered !== -1 ? firstUnanswered : 0];
        setSelectedAnswers(currentAns?.selectedAnswer || []);

        setLoading(false);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to start the test. Please try again.');
        setLoading(false);
      }
    };

    initializeCbt();

    // Check Network connection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fullscreen exit detection — auto-submit if user leaves fullscreen
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        const ctx = fsCtxRef.current;
        if (ctx.test?.fullscreenRequired && !ctx.isPreview && ctx.attempt) {
          ctx.autoSubmit();
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [testId]);

  // Request Fullscreen
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    }
  };

  // Exit Fullscreen after submission
  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || !attempt) return;
      
      // Arrow keys navigation
      if (e.key === 'ArrowRight') {
        handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        handleNavigate(currentIndex - 1);
      }
      
      // Options key selection (1-4 or A-D)
      const keyMap: { [key: string]: string } = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' };
      if (keyMap[e.key.toLowerCase()]) {
        handleOptionClick(keyMap[e.key.toLowerCase()]);
      }

      // Spacebar to flag
      if (e.key === ' ') {
        e.preventDefault();
        handleMarkForReview();
      }

      // Escape → leave reminder
      if (e.key === 'Escape') {
        setShowLeaveModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, attempt, loading, selectedAnswers]);

  // Intercept browser back navigation → show leave reminder, keep user on the page
  useEffect(() => {
    const handlePopState = () => {
      if (loading || !attempt) return;
      setShowLeaveModal(true);
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loading, attempt]);

  // Countdown timer clock
  useEffect(() => {
    if (loading || !attempt) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        
        // Background offline save increment
        const nextTime = prev - 1;
        if (nextTime % 10 === 0) {
          saveToLocalStorage(nextTime);
        }
        
        return nextTime;
      });

      // Decrease per-section timer
      setSectionTimeLeft(prev => {
        const activeIdx = attempt.activeSectionIndex;
        if (!prev.length || activeIdx < 0 || activeIdx >= prev.length) return prev;
        const next = [...prev];
        if (next[activeIdx] > 0) {
          next[activeIdx] = next[activeIdx] - 1;
          // Auto-switch section when time runs out
          if (next[activeIdx] === 0 && activeIdx < prev.length - 1) {
            setAttempt((a: any) => ({ ...a, activeSectionIndex: activeIdx + 1 }));
          }
        }
        return next;
      });

      // Track time spent on the currently viewed question (feeds "time spent today")
      setAttempt((a: any) => {
        if (!a?.answers || !a.answers.length) return a;
        const idx = currentIndexRef.current;
        if (idx < 0 || idx >= a.answers.length) return a;
        const answers = [...a.answers];
        answers[idx] = { ...answers[idx], timeSpent: (answers[idx].timeSpent || 0) + 1 };
        return { ...a, answers };
      });
    }, 1000);

    // Background HTTP saving task (runs every 30s)
    syncTimerRef.current = setInterval(() => {
      triggerBackgroundSync();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [loading, attempt]);

  // Sync helpers
  const saveToLocalStorage = (currentSeconds: number) => {
    if (!attempt) return;
    const key = `cbt-attempt-${attempt._id}`;
    localStorage.setItem(key, JSON.stringify({
      answers: attempt.answers,
      remainingSeconds: currentSeconds,
      activeSectionIndex: attempt.activeSectionIndex,
      sectionTimeLeft,
    }));
  };

  const triggerBackgroundSync = async (secondsForce?: number, attemptOverride?: any) => {
    const syncAttempt = attemptOverride || attempt;
    if (!syncAttempt) return;
    setSyncStatus('pending');
    try {
      await api.put(`/attempts/${syncAttempt._id}/save`, {
        answers: syncAttempt.answers.map((a: any) => ({
          questionId: a.questionId?._id || a.questionId,
          selectedAnswer: a.selectedAnswer,
          status: a.status,
          timeSpent: a.timeSpent
        })),
        remainingSeconds: secondsForce !== undefined ? secondsForce : timeLeft,
        activeSectionIndex: attempt.activeSectionIndex,
        sectionTimeLeft
      });
      setSyncStatus('synced');
    } catch (err) {
      console.warn('CBT sync failed, backing up locally.');
      setSyncStatus('error');
    }
  };

  const handleNavigate = (index: number) => {
    if (!attempt || index < 0 || index >= attempt.answers.length) return;
    
    // Save current active state before changing
    const updatedAnswers = [...attempt.answers];
    const prevAns = updatedAnswers[currentIndex];
    
    if (prevAns.status === 'Not Visited') {
      prevAns.status = 'Not Answered';
    }

    setAttempt({ ...attempt, answers: updatedAnswers });
    setCurrentIndex(index);
    setSelectedAnswers(attempt.answers[index]?.selectedAnswer || []);
  };

  const handleOptionClick = (key: string) => {
    const qType = attempt.answers[currentIndex].questionId.type;
    
    let next: string[];
    if (qType === 'Multiple Correct') {
      next = selectedAnswers.includes(key)
        ? selectedAnswers.filter(ans => ans !== key)
        : [...selectedAnswers, key];
    } else {
      // Single correct or True/False
      next = [key];
    }
    setSelectedAnswers(next);

    // Auto-save: persist selection into attempt.answers immediately so
    // background sync / refresh / auto-submit never lose it.
    if (attempt?.answers?.[currentIndex]) {
      const updatedAnswers = [...attempt.answers];
      updatedAnswers[currentIndex] = {
        ...updatedAnswers[currentIndex],
        selectedAnswer: next,
        status: next.length > 0 ? 'Answered' : 'Not Answered',
      };
      setAttempt({ ...attempt, answers: updatedAnswers });
    }
  };

  const handleNumericalChange = (val: string) => {
    setSelectedAnswers([val]);

    // Auto-save: persist numeric answer into attempt.answers immediately.
    if (attempt?.answers?.[currentIndex]) {
      const updatedAnswers = [...attempt.answers];
      updatedAnswers[currentIndex] = {
        ...updatedAnswers[currentIndex],
        selectedAnswer: [val],
        status: val ? 'Answered' : 'Not Answered',
      };
      setAttempt({ ...attempt, answers: updatedAnswers });
    }
  };

  const handleSaveAndNext = async () => {
    if (!attempt) return;
    
    const updatedAnswers = [...attempt.answers];
    const current = updatedAnswers[currentIndex];
    
    current.selectedAnswer = selectedAnswers;
    current.status = selectedAnswers.length > 0 ? 'Answered' : 'Not Answered';
    
    setAttempt({ ...attempt, answers: updatedAnswers });
    saveToLocalStorage(timeLeft);
    triggerBackgroundSync();

    if (currentIndex < attempt.answers.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  const handleMarkForReview = () => {
    if (!attempt) return;
    
    const updatedAnswers = [...attempt.answers];
    const current = updatedAnswers[currentIndex];
    
    current.selectedAnswer = selectedAnswers;
    current.status = selectedAnswers.length > 0 ? 'Answered & Marked for Review' : 'Marked for Review';
    
    setAttempt({ ...attempt, answers: updatedAnswers });
    saveToLocalStorage(timeLeft);
    triggerBackgroundSync();

    if (currentIndex < attempt.answers.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  const handleClearResponse = () => {
    setSelectedAnswers([]);
    if (!attempt) return;
    
    const updatedAnswers = [...attempt.answers];
    updatedAnswers[currentIndex].selectedAnswer = [];
    updatedAnswers[currentIndex].status = 'Not Answered';
    
    setAttempt({ ...attempt, answers: updatedAnswers });
  };

  // Submit the attempt (final sync → POST → results). Returns true on success;
  // on failure marks a pending submit so it can retry when back online.
  const doSubmit = async (a: any, onSuccess?: () => void) => {
    try {
      // Final sync so the latest selections reach the server before submit
      await triggerBackgroundSync(undefined, a);
      const res = await api.post(`/attempts/${a._id}/submit`, {});
      localStorage.removeItem(`cbt-attempt-${a._id}`);
      pendingSubmitRef.current = false;
      onSuccess?.();
      // End fullscreen mode after submission
      exitFullscreen();
      router.push(`/cbt/results/${res.data._id}`);
      return true;
    } catch (err) {
      console.error('Failed to submit exam', err);
      const e: any = err;
      if (e?.status === 400) {
        setErrorMessage(e?.message || 'Unable to submit the test. Please try again.');
      }
      pendingSubmitRef.current = true;
      return false;
    }
  };

  // Manual submit
  const handleFinalSubmit = async () => {
    if (!attempt) return;
    setLoading(true);
    const ok = await doSubmit(attempt, () => {
      // Fire confetti animation
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    });
    if (!ok) setLoading(false);
  };

  // Auto-submit when time runs out (or fullscreen is exited on a locked test)
  const handleAutoSubmit = async () => {
    const a = fsCtxRef.current.attempt;
    if (!a) return;
    await doSubmit(a);
  };

  // When the connection comes back, flush responses saved while offline,
  // or retry a pending submit that failed while offline.
  useEffect(() => {
    if (!isOnline) return;
    const a = fsCtxRef.current.attempt;
    if (!a) return;
    if (pendingSubmitRef.current) {
      doSubmit(a);
    } else {
      triggerBackgroundSync(undefined, a);
    }
  }, [isOnline]);

  // Format seconds into HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border border-rose-500/20 bg-card shadow-xl text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold font-outfit">Unable to Start Test</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors shadow-lg shadow-primary/25">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading || !test || (!isPreview && !attempt)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Preview mode — show all questions read-only
  if (isPreview) {
    const allQuestions = test.sections?.flatMap((s: any) => s.questions || []) || [];
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.close()} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{test.examId?.name}</span>
              <h1 className="text-lg font-bold font-outfit">{test.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <Eye className="w-4 h-4" /> Preview Mode
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8">
          <p className="text-xs text-muted-foreground">{allQuestions.length} question(s) · Read-only preview</p>
          {allQuestions.map((q: any, idx: number) => (
            <div key={q._id || idx} className="p-6 rounded-3xl border border-border bg-card">
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">Q{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <QuestionRenderer question={q} showOptions showExplanation showCorrectAnswer showMeta showHeader={false} />
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  const currentQuestion = attempt?.answers?.[currentIndex]?.questionId;

  // Question counters
  const answeredCount = attempt?.answers?.filter((a: any) => a.status === 'Answered').length || 0;
  const markedReviewCount = attempt?.answers?.filter((a: any) => a.status === 'Marked for Review' || a.status === 'Answered & Marked for Review').length || 0;
  const notAnsweredCount = attempt?.answers?.filter((a: any) => a.status === 'Not Answered').length || 0;
  const notVisitedCount = attempt?.answers?.filter((a: any) => a.status === 'Not Visited').length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      
      {/* Fullscreen Warning Cover */}
      {test.fullscreenRequired && !isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-6">
            <Monitor className="w-16 h-16 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold font-outfit mb-2">Fullscreen Mode Required</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            This examination is locked down. To prevent disqualification and continue taking this CBT test, you must remain in fullscreen mode.
          </p>
          <button 
            onClick={enterFullscreen}
            className="px-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/25"
          >
            Enter Fullscreen Mode
          </button>
        </div>
      )}

      {/* CBT Sub-Header / Telemetry bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.examId?.name} | {test.testSeriesId?.title}</span>
          <h1 className="text-lg font-bold font-outfit leading-tight mt-0.5">{test.title}</h1>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Connection Quality */}
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-300">Online {syncStatus === 'synced' ? '(Synced)' : '(Syncing)'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-400 animate-bounce" />
                <span className="text-xs text-rose-400 font-bold">Offline Cache Mode</span>
              </>
            )}
          </div>

          {/* Time Remaining Widget */}
          <div className="flex items-center gap-3 bg-rose-500/15 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs font-semibold uppercase tracking-wider">Time Left:</span>
            <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
            {test.sections.length > 1 && attempt.activeSectionIndex !== undefined && sectionTimeLeft[attempt.activeSectionIndex] > 0 && (
              <span className="text-xs text-rose-300 border-l border-rose-500/20 pl-3">
                Section: {formatTime(sectionTimeLeft[attempt.activeSectionIndex])}
              </span>
            )}
          </div>

          <button 
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors text-sm shadow-md shadow-emerald-500/20"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Grid: Left Question pane, Right navigation drawer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        
        {/* Left Side: Question Pane */}
        <div className="lg:col-span-3 flex flex-col overflow-y-auto p-6 md:p-8">
          
          {/* Section Selector (only when multiple sections) */}
          {test.sections.length > 1 && (
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
            {test.sections.map((sec: any, idx: number) => {
              const secRemaining = sectionTimeLeft[idx];
              return (
                <button 
                  key={sec._id}
                  onClick={() => {
                    // Compute start index of this section
                    let qi = 0;
                    for (let s = 0; s < idx; s++) {
                      qi += (test.sections[s].questions || []).length;
                    }
                    setAttempt((a: any) => ({ ...a, activeSectionIndex: idx }));
                    handleNavigate(qi);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
                    attempt.activeSectionIndex === idx 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {sec.name}
                  {secRemaining > 0 && (
                    <span className="text-[10px] font-mono opacity-70">{formatTime(secRemaining)}</span>
                  )}
                </button>
              );
            })}
          </div>
          )}

          {/* Question display */}
          <div className="flex-1 flex flex-col gap-6">
            {!currentQuestion ? (
              <div className="p-8 text-center text-muted-foreground text-sm border border-border rounded-3xl bg-card">Question data not available.</div>
            ) : (
              <>
            <div className="flex justify-end items-center text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span className="text-emerald-500 font-semibold">Marks: +{currentQuestion.marks ?? 1}</span>
                <span className="text-rose-500 font-semibold">Negative: -{currentQuestion.negativeMarks ?? 0}</span>
              </div>
            </div>

            {/* Question Text Body */}
            <div className="bg-card p-6 rounded-3xl border border-border">
              <span className="font-bold text-primary mr-2 font-outfit">Q{currentIndex + 1}.</span>
              <QuestionRenderer question={currentQuestion} showOptions={false} showHeader={false} />
            </div>

            {/* Answer Options Selector */}
            <div className="flex flex-col gap-3 mt-4">
              {currentQuestion.options?.length ? (
                currentQuestion.options.map((opt: any) => {
                  const isSelected = selectedAnswers.includes(opt.key);
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
                      <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm transition-all ${
                        isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {opt.key}
                      </div>
                      <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>{opt.text}</span>
                    </button>
                  );
                })
              ) : ['Integer', 'Numerical'].includes(currentQuestion.type) ? (
                <div className="p-6 rounded-3xl border border-border bg-card">
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Type your numeric answer here:</label>
                  <input 
                    type="number"
                    step="any"
                    value={selectedAnswers[0] || ''}
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="E.g., 60 or 15.5"
                    className="w-full max-w-xs px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              ) : (
                <div className="p-6 rounded-3xl border border-border bg-card text-center text-sm text-muted-foreground">No options available for this question.</div>
              )}
            </div>
              </>
            )}
          </div>

          {/* Navigation Controls bottom bar */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
            <button 
              onClick={handleClearResponse}
              className="px-5 py-3 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
            >
              Clear Response
            </button>

            <div className="flex gap-3">
              <button 
                onClick={handleMarkForReview}
                className="px-5 py-3 rounded-xl border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5 text-sm font-semibold transition-colors"
              >
                Mark for Review & Next
              </button>
              <button 
                onClick={handleSaveAndNext}
                className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/95 text-sm font-semibold transition-all shadow-md shadow-primary/20"
              >
                Save & Next
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Question Navigation Drawer */}
        <div className="border-l border-border bg-secondary/20 flex flex-col overflow-hidden">
          
          {/* Candidate Profile Widget */}
          <div className="p-6 border-b border-border bg-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
              {cbtUser?.name?.charAt(0) || '?'}
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Candidate</span>
              <span className="text-sm font-bold block">{cbtUser?.name || 'Student'}</span>
            </div>
          </div>

          {/* Questions Grid Palette */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Question Palette</h4>
            
            <div className="grid grid-cols-5 gap-3">
              {attempt.answers.map((ans: any, idx: number) => {
                let badgeColor = 'bg-card border-border text-muted-foreground hover:bg-muted';
                if (ans.status === 'Answered') badgeColor = 'bg-emerald-500 text-white border-emerald-500';
                else if (ans.status === 'Marked for Review') badgeColor = 'bg-indigo-500 text-white border-indigo-500';
                else if (ans.status === 'Answered & Marked for Review') badgeColor = 'bg-indigo-500 text-white border-indigo-500 relative after:content-[""] after:absolute after:w-2 after:h-2 after:bg-emerald-400 after:rounded-full after:top-1 after:right-1';
                else if (ans.status === 'Not Answered') badgeColor = 'bg-rose-500 text-white border-rose-500';

                return (
                  <button 
                    key={ans.questionId?._id || ans.questionId || `ans-${idx}`}
                    onClick={() => handleNavigate(idx)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${badgeColor} ${
                      currentIndex === idx ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="p-6 border-t border-border bg-card grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-500"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-rose-500"></span>
              <span>Not Answered ({notAnsweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-indigo-500"></span>
              <span>Marked Review ({markedReviewCount})</span>
            </div>
            <div className="flex items-center gap-2 border border-border rounded px-1.5 py-0.5 w-fit">
              <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
              <span>Not Visited ({notVisitedCount})</span>
            </div>
          </div>

        </div>

      </div>

      {/* Leave Reminder Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center gap-4">
            <div className="p-3.5 rounded-full bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold font-outfit">Leaving the test?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you go back now, your test will be <strong>submitted automatically</strong> and this attempt will be <strong>counted</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="py-3 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors"
              >
                Continue Test
              </button>
              <button 
                onClick={handleFinalSubmit}
                className="py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all text-sm shadow-md shadow-rose-500/20"
              >
                Submit &amp; Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Warning Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center gap-4">
            <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold font-outfit">Are you sure you want to submit?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have answered <strong>{answeredCount}</strong> out of <strong>{attempt.answers.length}</strong> questions.<br />
              Once submitted, you will not be able to change your responses.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="py-3 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={handleFinalSubmit}
                className="py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all text-sm shadow-md shadow-emerald-500/20"
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

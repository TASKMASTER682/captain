'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  ArrowLeft, CheckCircle2, XCircle, BookOpen, 
  ChevronRight, Bookmark, Filter, Clock, Timer,
  Target, Zap, BookMarked
} from 'lucide-react';
import QuestionRenderer from '@/components/QuestionRenderer';
import Link from 'next/link';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const source = searchParams.get('source') || ''; // 'weak' | 'slow' | '' (custom)
  const urlSubject = searchParams.get('subject') || '';
  const urlTopic = searchParams.get('topic') || '';
  const urlMode = searchParams.get('mode') || '';
  const urlLimit = parseInt(searchParams.get('limit') || '10', 10);

  // Filters (for custom practice)
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState(urlSubject);
  const [topic, setTopic] = useState(urlTopic);
  const [difficulty, setDifficulty] = useState('');
  const [mode, setMode] = useState<'learning' | 'exam'>(
    urlMode === 'speed' ? 'exam' : 'learning'
  );

  // Practice Session States
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examEnded, setExamEnded] = useState(false);
  const [answersLog, setAnswersLog] = useState<{ q: any; selected: string; correct: boolean }[]>([]);

  // Fetch available subjects on mount (for custom practice)
  useEffect(() => {
    api.get('/practice/subjects').then(res => setSubjects(res.data || [])).catch(() => {});
  }, []);

  // Auto-start if URL has source=weak or source=slow (from recommendations/dashboard)
  useEffect(() => {
    if (source === 'weak' || source === 'slow') {
      loadWeakOrSlowQuestions();
    } else if (searchParams.get('questionIds')) {
      loadSpecificQuestions();
    } else if (urlSubject || urlTopic) {
      handleStartPractice();
    }
  }, [searchParams]);

  const loadWeakOrSlowQuestions = async () => {
    setLoading(true);
    try {
      const endpoint = source === 'weak' ? '/practice/weak-questions' : '/practice/slow-questions';
      const params = new URLSearchParams();
      if (urlTopic) params.set('topic', urlTopic);
      if (urlSubject) params.set('subject', urlSubject);
      params.set('limit', '10');

      const res = await api.get(`${endpoint}?${params.toString()}`);
      const qs = res.data || [];
      if (qs.length === 0) {
        setLoading(false);
        return;
      }
      setQuestions(qs);
      setSessionActive(true);
      setCurrentIndex(0);
      setIsAnswered(false);
      setSelectedOpt('');
      setScore(0);
      setExamEnded(false);
      setAnswersLog([]);
      setLoading(false);
      checkBookmarkStatus(qs[0]?._id || qs[0]?.questionId);
    } catch (err) {
      console.error('Failed to load practice questions', err);
      setLoading(false);
    }
  };

  const loadSpecificQuestions = async () => {
    setLoading(true);
    try {
      const questionIds = searchParams.get('questionIds') || '';
      const res = await api.get(`/practice/generate?questionIds=${encodeURIComponent(questionIds)}`);
      const qs = res.data || [];
      if (qs.length === 0) {
        setLoading(false);
        return;
      }
      setQuestions(qs);
      setSessionActive(true);
      setCurrentIndex(0);
      setIsAnswered(false);
      setSelectedOpt('');
      setScore(0);
      setExamEnded(false);
      setAnswersLog([]);
      setLoading(false);
      checkBookmarkStatus(qs[0]?._id);
    } catch (err) {
      console.error('Failed to load practice questions', err);
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/practice/generate?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&limit=${urlLimit}`
      );
      const qs = res.data || [];
      if (qs.length === 0) {
        setLoading(false);
        return;
      }
      setQuestions(qs);
      setSessionActive(true);
      setCurrentIndex(0);
      setIsAnswered(false);
      setSelectedOpt('');
      setScore(0);
      setExamEnded(false);
      setAnswersLog([]);
      if (mode === 'exam') {
        setTimeLeft(qs.length * 60);
      }
      setLoading(false);
      checkBookmarkStatus(qs[0]?._id);
    } catch (err) {
      console.error('Failed to generate practice set', err);
      setLoading(false);
    }
  };

  // Exam-mode countdown timer
  useEffect(() => {
    if (mode !== 'exam' || !sessionActive || examEnded || timeLeft <= 0) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        handleEndExam();
      } else {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [mode, sessionActive, examEnded, timeLeft]);

  const handleEndExam = () => {
    setIsAnswered(false);
    setExamEnded(true);
    setSessionActive(false);
  };

  const checkBookmarkStatus = async (qId: string) => {
    if (!qId) return;
    try {
      const res = await api.get('/bookmarks');
      const bookmarked = res.data.some((bm: any) => bm.questionId._id === qId || bm.questionId === qId);
      setIsBookmarked(bookmarked);
    } catch (_e) {
      setIsBookmarked(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (questions.length === 0) return;
    const qId = questions[currentIndex]._id || questions[currentIndex].questionId;
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${qId}`);
        setIsBookmarked(false);
      } else {
        await api.post('/bookmarks', { questionId: qId });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Learning mode: instant feedback on option select
  const handleOptionSelect = (key: string) => {
    if (isAnswered) return;
    setSelectedOpt(key);

    // In learning mode, immediately show the answer + explanation
    if (mode === 'learning') {
      setIsAnswered(true);
      const correct = questions[currentIndex].correctAnswer.includes(key);
      if (correct) {
        setScore(prev => prev + 1);
      }
    }
  };

  // Exam mode: Save & Next
  const saveAndNext = () => {
    const q = questions[currentIndex];
    const isCorrect = q.correctAnswer.includes(selectedOpt);
    const nextLog = [...answersLog, { q, selected: selectedOpt, correct: isCorrect }];
    setAnswersLog(nextLog);
    if (isCorrect) setScore(prev => prev + 1);
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswered(false);
      setSelectedOpt('');
      checkBookmarkStatus(questions[nextIdx]?._id || questions[nextIdx]?.questionId);
    } else {
      setExamEnded(true);
      setSessionActive(false);
      setTimeLeft(0);
    }
  };

  // Learning mode: Next Question (after instant feedback)
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswered(false);
      setSelectedOpt('');
      checkBookmarkStatus(questions[nextIdx]?._id || questions[nextIdx]?.questionId);
    } else {
      setSessionActive(false);
    }
  };

  // Determine source label for header
  const getSourceLabel = () => {
    if (source === 'weak') return { text: 'Weak Topics Practice', icon: Target, color: 'text-rose-500' };
    if (source === 'slow') return { text: 'Slow Topics Practice', icon: Zap, color: 'text-amber-500' };
    if (searchParams.get('questionIds')) return { text: 'Saved Questions Practice', icon: BookMarked, color: 'text-indigo-500' };
    return { text: 'Adaptive Practice Deck', icon: null, color: 'text-primary' };
  };
  const sourceInfo = getSourceLabel();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            {sourceInfo.icon && <sourceInfo.icon className={`w-5 h-5 ${sourceInfo.color}`} />}
            <h1 className="font-bold text-lg font-outfit">{sourceInfo.text}</h1>
          </div>
        </div>
        {sessionActive && (
          <div className="flex items-center gap-2">
            {mode === 'exam' && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${timeLeft <= 60 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            )}
            <div className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10">
              Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {examEnded ? (
          /* Exam Mode Review Screen */
          <div className="p-8 rounded-3xl border border-border bg-card shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <Timer className="w-5 h-5" />
              <h2 className="text-xl font-outfit">Exam Style — Result</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-border bg-background flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className="text-3xl font-black font-outfit text-primary">{score} / {questions.length}</span>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-background flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Accuracy</span>
                <span className="text-3xl font-black font-outfit text-emerald-500">
                  {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold font-outfit flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Review Answers
              </h3>
              {answersLog.map((entry: any, i: number) => (
                <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-2 ${entry.correct ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-rose-500/20 bg-rose-500/[0.03]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">Q{i + 1}. {entry.q.body?.split('\n')[0]}</span>
                    {entry.correct ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold shrink-0"><CheckCircle2 className="w-3 h-3" /> Correct</span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold shrink-0"><XCircle className="w-3 h-3" /> Wrong</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
                    <span>Your answer: <b className="text-foreground">{entry.selected || 'Skipped'}</b></span>
                    {!entry.correct && <span>Correct: <b className="text-emerald-500">{(entry.q.correctAnswer || []).join(', ')}</b></span>}
                  </div>
                  {entry.q.explanation && (
                    <p className="text-[11px] text-muted-foreground whitespace-pre-line border-t border-border/50 pt-2">{entry.q.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => { setExamEnded(false); setSessionActive(false); }} className="py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition-all text-sm">
              Start a New Practice Deck
            </button>
          </div>
        ) : !sessionActive ? (
          /* Filter Selection Board — only for Custom Practice */
          <div className="p-8 rounded-3xl border border-border bg-card shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Filter className="w-5 h-5" />
              <h2 className="text-xl font-outfit">Assemble Custom Practice Set</h2>
            </div>
            <p className="text-xs text-muted-foreground">Select criteria below to index matching questions from the master Question Bank:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Subject dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Topic (Optional)</label>
                <input 
                  type="text"
                  placeholder="E.g., Profit and Loss"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              {/* Difficulty dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="">Any Difficulty</option>
                  <option value="Easy">Easy Only</option>
                  <option value="Medium">Medium Only</option>
                  <option value="Hard">Hard Only</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Practice Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('learning')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    mode === 'learning'
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-1" /> Learning
                </button>
                <button
                  onClick={() => setMode('exam')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    mode === 'exam'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" /> Exam Style
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {mode === 'learning'
                  ? 'Untimed, instant feedback & explanations on.'
                  : 'Timed (60s/question), explanations hidden until you finish.'}
              </p>
            </div>
          </div>

            <button 
              onClick={handleStartPractice}
              className="mt-4 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/20"
            >
              Generate Practice Deck (10 Questions)
            </button>
          </div>
        ) : (
          /* Active Practice Session interface */
          questions.length === 0 || !questions[currentIndex] ? (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-lg flex flex-col gap-4 text-center">
            <p className="text-sm text-muted-foreground">No questions found matching your filters.</p>
            <button onClick={() => { setSessionActive(false); setExamEnded(false); }} className="py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-all">
              Try Different Filters
            </button>
          </div>
          ) : (
          <div className="flex flex-col gap-6">
            
            {/* Header progress line */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong></span>
              <span>Topic: <strong>{questions[currentIndex].topic}</strong></span>
            </div>

            {/* Question card */}
            <div className="p-8 rounded-3xl border border-border bg-card flex flex-col gap-6 shadow-sm relative">
              <button 
                onClick={handleToggleBookmark}
                className={`absolute top-6 right-6 p-2 rounded-xl border transition-colors ${
                  isBookmarked 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Bookmark Question"
              >
                <Bookmark className="w-5 h-5" />
              </button>

              <QuestionRenderer question={questions[currentIndex]} showOptions={false} showHeader={false} />

              {/* Options */}
              <div className="flex flex-col gap-3 mt-4">
                {questions[currentIndex].options.map((opt: any) => {
                  const isSelected = selectedOpt === opt.key;
                  const isCorrect = questions[currentIndex].correctAnswer.includes(opt.key);
                  
                  let optionStyle = 'border-border bg-card hover:bg-muted/50';
                  if (isAnswered) {
                    if (isCorrect) optionStyle = 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-semibold';
                    else if (isSelected) optionStyle = 'border-rose-500 bg-rose-500/5 text-rose-600';
                  } else if (isSelected) {
                    optionStyle = 'border-primary bg-primary/5';
                  }

                  return (
                    <button 
                      key={opt.key}
                      onClick={() => handleOptionSelect(opt.key)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${optionStyle}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {opt.key}
                      </div>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer feedback & actions */}
            {mode === 'exam' ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={saveAndNext}
                  disabled={!selectedOpt}
                  className="py-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  {currentIndex < questions.length - 1 ? 'Save & Next' : 'Finish Exam'}
                </button>
                <button onClick={handleEndExam} className="py-3 rounded-xl border border-border text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors">
                  End & Review Answers
                </button>
              </div>
            ) : isAnswered ? (
              <div className="flex flex-col gap-6">
                
                {/* Score Alert */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${
                  questions[currentIndex].correctAnswer.includes(selectedOpt)
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
                    : 'border-rose-500/20 bg-rose-500/5 text-rose-600'
                }`}>
                  {questions[currentIndex].correctAnswer.includes(selectedOpt) ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Correct Answer! You earned 1 point.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Incorrect. Correct answer is option <strong>{questions[currentIndex].correctAnswer[0]}</strong>.</span>
                    </>
                  )}
                </div>

                {/* Explanation Card */}
                <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 text-primary font-bold mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Solution Explanation</span>
                  </div>
                  <p className="whitespace-pre-line text-muted-foreground">{questions[currentIndex].explanation || 'No detailed explanation provided for this question.'}</p>
                </div>

                <button 
                  onClick={handleNext}
                  className="py-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>

              </div>
            ) : null}

          </div>
          )
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS Practice Engine.
      </footer>
    </div>
  );
}

export default function PracticeMode() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}

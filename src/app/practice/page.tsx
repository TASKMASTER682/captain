'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  ArrowLeft, CheckCircle2, XCircle, Info, BookOpen, 
  HelpCircle, ChevronRight, Bookmark, Sparkles, Filter 
} from 'lucide-react';
import QuestionRenderer from '@/components/QuestionRenderer';
import Link from 'next/link';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [difficulty, setDifficulty] = useState('');

  // Fetch available subjects on mount
  useEffect(() => {
    api.get('/questions/subjects').then(res => setSubjects(res.data || [])).catch(() => {});
  }, []);
  
  // Practice Session States
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-generate if query parameters exist
  useEffect(() => {
    if (searchParams.get('subject') || searchParams.get('topic')) {
      handleStartPractice();
    }
  }, [searchParams]);

  const handleStartPractice = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/practice/generate?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&limit=10`
      );
      setQuestions(res.data || []);
      setSessionActive(true);
      setCurrentIndex(0);
      setIsAnswered(false);
      setSelectedOpt('');
      setScore(0);
      setLoading(false);
      checkBookmarkStatus(res.data[0]?._id);
    } catch (err) {
      console.error('Failed to generate practice set', err);
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (qId: string) => {
    if (!qId) return;
    try {
      const res = await api.get('/bookmarks');
      const bookmarked = res.data.some((bm: any) => bm.questionId._id === qId || bm.questionId === qId);
      setIsBookmarked(bookmarked);
    } catch {
      setIsBookmarked(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (questions.length === 0) return;
    const qId = questions[currentIndex]._id;
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

  const handleOptionSelect = (key: string) => {
    if (isAnswered) return;
    setSelectedOpt(key);
  };

  const handleCheckAnswer = () => {
    if (!selectedOpt || isAnswered) return;
    setIsAnswered(true);
    const correct = questions[currentIndex].correctAnswer[0] === selectedOpt;
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswered(false);
      setSelectedOpt('');
      checkBookmarkStatus(questions[nextIdx]?._id);
    } else {
      // Session finished
      setSessionActive(false);
    }
  };

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
          <h1 className="font-bold text-lg font-outfit">Adaptive Practice Deck</h1>
        </div>
        {sessionActive && (
          <div className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10">
            Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {!sessionActive ? (
          /* Filter Selection Board */
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
            {!isAnswered ? (
              <button 
                onClick={handleCheckAnswer}
                disabled={!selectedOpt}
                className="py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 disabled:opacity-50 transition-all text-sm"
              >
                Validate Answer
              </button>
            ) : (
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
                      <span>Correct Answer! You earned 2 points.</span>
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
            )}

          </div>
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

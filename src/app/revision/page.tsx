'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ArrowLeft, Brain, Calendar, Check, X, 
  HelpCircle, RefreshCw, Sparkles, BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import QuestionRenderer from '@/components/QuestionRenderer';

export default function SpacedRepetitionRevision() {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadPendingRevisions();
  }, []);

  const loadPendingRevisions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practice/revision/pending');
      setRevisions(res.data || []);
      setCurrentIndex(0);
      setShowAnswer(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRevisionAttempt = async (wasCorrect: boolean) => {
    if (revisions.length === 0) return;
    const currentItem = revisions[currentIndex];
    
    try {
      await api.post('/practice/revision/attempt', {
        questionId: currentItem.questionId._id,
        wasCorrect,
      });

      // Advance index
      if (currentIndex < revisions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Complete queue reload
        loadPendingRevisions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  const currentItem = revisions[currentIndex];
  const question = currentItem?.questionId;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit">Spaced Repetition Revision</h1>
        </div>
        <div className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5" /> Active Retention System
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {revisions.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-3xl border border-border bg-card shadow-lg flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-outfit">All Caught Up!</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your spaced repetition revision queue is empty. Flagged mistakes from mock tests are scheduled dynamically.
            </p>
            <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold">
              Return to Cockpit
            </Link>
          </div>
        ) : (
          /* Active Revision Cards Stack */
          <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Card <strong>{currentIndex + 1}</strong> of <strong>{revisions.length}</strong></span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Stage {currentItem.stage} (Day Interval check)
              </span>
            </div>

            {/* Question Front */}
            <div className="p-8 rounded-3xl border border-border bg-card shadow-md flex flex-col gap-6 min-h-[260px] justify-between relative">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-2">{question?.subject}</span>
              
              <QuestionRenderer question={question || {}} showOptions={false} showHeader={false} showMeta />

              {!showAnswer ? (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all text-sm mt-8"
                >
                  Reveal Solution & Answer
                </button>
              ) : (
                <div className="mt-8 border-t border-border pt-6 flex flex-col gap-4">
                  <QuestionRenderer question={question || {}} showExplanation showCorrectAnswer showOptions showHeader={false} />
                </div>
              )}
            </div>

            {/* Spaced repetition review validation buttons */}
            {showAnswer && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button 
                  onClick={() => handleRevisionAttempt(false)}
                  className="py-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 font-bold hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <X className="w-4.5 h-4.5" /> I Forgot (Reset to Day 1)
                </button>
                <button 
                  onClick={() => handleRevisionAttempt(true)}
                  className="py-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-bold hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4.5 h-4.5" /> I Remembered (Advance Stage)
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Spaced Repetition Algorithm: SuperMemo-2 inspired layout rules.
      </footer>
    </div>
  );
}

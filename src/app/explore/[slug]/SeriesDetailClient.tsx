'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/api';
import PublicHeader from '@/components/PublicHeader';
import {
  Lock, GraduationCap, CheckCircle2, IndianRupee,
  Play, Clock, ChevronDown, ChevronUp, Loader2, BookOpenCheck,
} from 'lucide-react';

// Defense-in-depth: the backend already sanitizes on write + read, but strip
// anything that could execute if a stale record somehow ships raw HTML.
const sanitizeHtml = (html: string) => String(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
  .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
  .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, '')
  .replace(/<embed\b[^>]*>[\s\S]*?<\/embed\s*>/gi, '')
  .replace(/<link\b[^>]*>/gi, '')
  .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript\s*:/gi, '')
  // The page hero already renders the series title as the single <h1>;
  // demote any <h1> inside the pasted body so the page keeps exactly one.
  .replace(/<h1(\b[^>]*)>/gi, '<h2$1>')
  .replace(/<\/h1\s*>/gi, '</h2>');

export default function SeriesDetailClient({ series }: { series: any }) {
  const router = useRouter();
  const price = Number(series.price) || 0;
  const isFree = price <= 0;
  const detailPath = `/explore/${series.slug || series._id}`;

  const [showTests, setShowTests] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const handleBuy = () => {
    const user = getAuthUser();
    if (!user) {
      router.push(`/login?mode=signup&redirect=${encodeURIComponent(detailPath)}`);
      return;
    }
    router.push(`/test-series?enroll=${series._id}`);
  };

  const toggleTests = async () => {
    if (showTests) {
      setShowTests(false);
      return;
    }
    setShowTests(true);
    setLoadingTests(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/tests?testSeriesId=${series._id}`);
      const json = await res.json();
      setTests(Array.isArray(json.data) ? json.data : []);
    } catch {
      setTests([]);
    }
    setLoadingTests(false);
  };

  const handleStartTest = (test: any) => {
    const user = getAuthUser();
    if (!user) {
      router.push(`/login?mode=signup&redirect=${encodeURIComponent(`/cbt/${test._id}`)}`);
      return;
    }
    if (test.isLocked) {
      router.push(`/test-series?enroll=${series._id}`);
      return;
    }
    router.push(`/cbt/${test._id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Header — Buy CTA shows on desktop; mobile uses the hero button below */}
      <PublicHeader
        cta={
          <button
            onClick={handleBuy}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
              isFree ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            }`}
          >
            {isFree ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isFree ? 'Enroll Free' : `Buy · ₹${price}`}
          </button>
        }
      />

      <main className="flex-1 w-full">
        {/* Hero card */}
        <section className="max-w-5xl mx-auto w-full px-6 pt-8">
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="h-48 sm:h-60 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary relative">
              {series.banner ? (
                <img src={series.banner} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-14 h-14 text-primary/30" />
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {series.examId?.name && (
                  <span className="text-[10px] font-bold text-primary px-2 py-1 rounded-lg bg-primary/10 border border-primary/10">{series.examId.name}</span>
                )}
                {series.difficulty && series.difficulty !== 'mix' && (
                  <span className="text-[10px] font-bold capitalize px-2 py-1 rounded-lg bg-muted text-muted-foreground">{series.difficulty} difficulty</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-outfit tracking-tight">{series.title}</h1>
              {series.description && <p className="text-sm text-muted-foreground">{series.description}</p>}
              {series.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {series.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-border mt-2">
                <div className="flex items-baseline gap-1.5">
                  {isFree ? (
                    <span className="text-2xl font-black font-outfit text-emerald-600">Free</span>
                  ) : (
                    <>
                      <IndianRupee className="w-6 h-6 text-amber-600" />
                      <span className="text-3xl font-black font-outfit">{price}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">one-time · full access</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    onClick={toggleTests}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {showTests ? <><ChevronUp className="w-4 h-4" /> Hide Tests</> : <><ChevronDown className="w-4 h-4" /> View Tests</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tests List Section */}
        {showTests && (
          <section className="max-w-5xl mx-auto w-full px-6 py-6">
            <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-primary" /> Tests in this Series
            </h2>
            {loadingTests ? (
              <div className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading tests...
              </div>
            ) : tests.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card">
                No tests in this series yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tests.slice(0, 5).map((test: any) => (
                  <div key={test._id} className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col gap-1 flex-1">
                      <h3 className="font-bold text-sm font-outfit flex items-center gap-2">
                        {test.title}
                        {test.memberOnly && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold">MEMBERS</span>}
                        {test.isFree && !test.memberOnly && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">FREE</span>}
                      </h3>
                      {test.description && <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration} min</span>
                        <span>Sections: {test.sections?.length || 0}</span>
                        {test.attemptLimit ? <span>Attempts: {test.attemptLimit}</span> : null}
                      </div>
                    </div>
                    {test.isLocked || test.memberOnly ? (
                      <button
                        onClick={() => handleStartTest(test)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-500/95 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Lock className="w-4 h-4" /> Upgrade to Unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTest(test)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/95 shadow-md shadow-primary/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start CBT
                      </button>
                    )}
                  </div>
                ))}
                {tests.length > 5 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary border border-border">
                      <Lock className="w-3.5 h-3.5" />
                      {tests.length - 5} more tests — enroll to unlock all
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Landing body HTML */}
        <section className="max-w-5xl mx-auto w-full px-6 py-10">
          {series.body ? (
            <article className="series-body">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(series.body) }} />
            </article>
          ) : (
            <div className="py-12 text-center border border-dashed border-border rounded-3xl bg-card">
              <p className="text-sm text-muted-foreground mb-4">Detailed information about this series is coming soon.</p>
              <Link href="/explore" className="text-xs font-bold text-primary hover:underline">← Browse all test series</Link>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>

      {/* Safelist: utility classes the CMS body HTML is allowed to use. Tailwind
          only generates classes found in source files — DB content isn't scanned,
          so every whitelisted class must literally appear here to have effect. */}
      <div
        aria-hidden="true"
        className="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-2 gap-3 gap-4 gap-6 flex flex-wrap items-center items-start justify-center justify-between text-center w-full max-w-full mx-auto rounded-xl rounded-2xl rounded-3xl rounded-full border border-border overflow-hidden overflow-x-auto shadow-sm shadow-md shadow-lg p-4 p-5 p-6 px-4 py-3 px-6 py-4 mt-6 mb-6 mb-8 space-y-3 space-y-4 space-y-6 text-xs text-sm text-base text-lg text-xl text-2xl text-3xl font-medium font-semibold font-bold font-black leading-relaxed uppercase tracking-wide tracking-tight italic bg-card bg-muted bg-primary/10 text-foreground text-muted-foreground text-primary text-accent transition-colors hover:bg-muted line-clamp-2 font-outfit opacity-80"
      />
    </div>
  );
}

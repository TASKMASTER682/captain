'use client';

// Public landing page for one exam: every active test series under it,
// reachable from the dashboard's agency-exam cards.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import PublicHeader from '@/components/PublicHeader';
import {
  ArrowLeft, GraduationCap, Star, CreditCard, BookOpenCheck, ArrowRight, Building2,
} from 'lucide-react';

function PriceBadge({ price }: { price: number }) {
  if (!price || price <= 0) {
    return (
      <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
        <CreditCard className="w-3 h-3" /> Free
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold text-amber-600 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
      <CreditCard className="w-3 h-3" /> ₹{price}
    </span>
  );
}

export default function ExamTestSeriesPage() {
  const params = useParams();
  const rawId = params?.id;
  const examId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? String(rawId[0] || '') : '';

  const [exam, setExam] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!examId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/exams/${examId}`).catch(() => null),
      api.get(`/test-series?examId=${examId}`).catch(() => ({ data: [] })),
    ]).then(([examRes, seriesRes]) => {
      if (cancelled) return;
      setExam(examRes?.data || null);
      setNotFound(!examRes?.data);
      setSeries(Array.isArray(seriesRes?.data) ? seriesRes.data : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 sm:py-10 flex flex-col gap-8">
        {/* Back */}
        <Link href="/dashboard" className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Exam hero */}
        {loading ? (
          <div className="rounded-3xl border border-border bg-card p-8 animate-pulse">
            <div className="h-4 w-24 rounded bg-muted mb-4" />
            <div className="h-7 w-2/3 rounded bg-muted mb-3" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ) : notFound || !exam ? (
          <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-3">
            <BookOpenCheck className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Exam not found.</p>
            <Link href="/dashboard" className="text-xs font-bold text-primary hover:underline">Go back to dashboard</Link>
          </div>
        ) : (
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent/[0.07] pointer-events-none" />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {exam.agencyId && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <Building2 className="w-3 h-3" /> {exam.agencyId.code || exam.agencyId.name}
                  </span>
                )}
                {exam.code && (
                  <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 rounded-lg bg-secondary">{exam.code}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-outfit tracking-tight flex items-start gap-3">
                <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary hidden sm:flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5" />
                </span>
                {exam.name}
              </h1>
              {exam.description && (
                <p className="text-sm text-muted-foreground max-w-2xl">{exam.description}</p>
              )}
            </div>
          </section>
        )}

        {/* Series count strip */}
        {!loading && !notFound && (
          <p className="text-xs text-muted-foreground -mt-4">
            {series.length > 0 ? (
              <>Showing <span className="font-semibold text-foreground">{series.length}</span> test series{exam?.name ? ` for ${exam.name}` : ''}</>
            ) : ''}
          </p>
        )}

        {/* Series grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-36 bg-muted" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-8 w-full rounded-xl bg-muted mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : !notFound && series.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-3">
            <BookOpenCheck className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No test series available for this exam yet. Check back soon!</p>
            <Link href="/explore" className="text-xs font-bold text-primary hover:underline">Browse all test series</Link>
          </div>
        ) : (
          !notFound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {series.map((ts) => (
                <Link
                  key={ts._id}
                  href={`/explore/${ts.slug || ts._id}`}
                  className="group rounded-3xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  {/* Banner */}
                  <div className="h-36 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary relative overflow-hidden">
                    {ts.banner ? (
                      <img src={ts.banner} alt={ts.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {ts.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col gap-2.5 flex-1">
                    <h2 className="font-bold font-outfit leading-snug line-clamp-2 group-hover:text-primary transition-colors">{ts.title}</h2>
                    {ts.description && <p className="text-xs text-muted-foreground line-clamp-2">{ts.description}</p>}
                    {ts.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ts.tags.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
                      <PriceBadge price={ts.price} />
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                        View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>
    </div>
  );
}

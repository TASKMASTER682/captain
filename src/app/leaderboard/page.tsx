'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Trophy, Crown, Medal, Loader2, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';

function LeaderboardPage() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const seriesId = searchParams.get('testSeriesId');
  const detailMode = Boolean(testId || seriesId);

  const [data, setData] = useState<any>(null);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (detailMode) {
          const endpoint = testId ? `/leaderboard/test/${testId}?limit=50` : `/leaderboard/series/${seriesId}?limit=50`;
          const res = await api.get(endpoint);
          setData(res.data);
        } else {
          const res = await api.get('/leaderboard/my-series');
          setSeriesList(res.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard.');
      }
      setLoading(false);
    };
    load();
  }, [testId, seriesId, detailMode]);

  const entries = data?.entries || [];
  const title = testId ? data?.test?.title : data?.series?.title;
  const myEntry = data?.myEntry;
  const backHref = detailMode ? '/leaderboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
          </h1>
        </div>
        <span className="text-xs text-muted-foreground">
          {detailMode ? (testId ? 'Per Test' : 'Per Test Series') : 'My Test Series'}
        </span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leaderboard...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500 font-semibold">{error}</div>
        ) : detailMode ? (
          <>
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold font-outfit">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {testId ? 'Ranked by score across all submissions.' : 'Ranked by each student\'s best score across all tests in the series.'}
              </p>
            </div>

            {myEntry && (
              <div className="p-5 rounded-3xl border border-primary/30 bg-primary/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground">Your standing</span>
                    <div className="text-2xl font-black font-outfit text-primary">#{myEntry.rank}</div>
                  </div>
                </div>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  {testId ? (
                    <>
                      <span>Score <b className="text-foreground">{myEntry.score}</b></span>
                      <span>Percentile <b className="text-foreground">{myEntry.percentile}%ile</b></span>
                    </>
                  ) : (
                    <>
                      <span>Best Score <b className="text-foreground">{myEntry.bestScore}</b></span>
                      <span>Percentile <b className="text-foreground">{myEntry.percentile}%ile</b></span>
                    </>
                  )}
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground">
                <Medal className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No submissions yet.</p>
              </div>
            ) : (
              <div className="border border-border rounded-3xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Student</th>
                        {testId ? (
                          <>
                            <th className="px-6 py-4 text-right">Score</th>
                            <th className="px-6 py-4 text-right">Accuracy</th>
                            <th className="px-6 py-4 text-right">Percentile</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-4 text-right">Best Score</th>
                            <th className="px-6 py-4 text-right">Accuracy</th>
                            <th className="px-6 py-4 text-right">Tests</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e: any) => (
                        <tr key={e.rank} className={`border-b border-border hover:bg-muted/50 transition-colors ${e.isMe ? 'bg-primary/5' : ''}`}>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black font-mono text-xs ${e.rank === 1 ? 'bg-amber-500 text-white' : e.rank === 2 ? 'bg-slate-400 text-white' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-secondary text-muted-foreground'}`}>{e.rank}</span>
                          </td>
                          <td className="px-6 py-4 font-bold">
                            {e.studentName}
                            {e.isMe && <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded">You</span>}
                          </td>
                          {testId ? (
                            <>
                              <td className="px-6 py-4 text-right font-mono font-bold">{e.score}</td>
                              <td className="px-6 py-4 text-right font-mono">{Math.round(e.accuracy)}%</td>
                              <td className="px-6 py-4 text-right font-mono text-primary">{e.percentile}%</td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-right font-mono font-bold">{e.bestScore}</td>
                              <td className="px-6 py-4 text-right font-mono">{Math.round(e.bestAccuracy)}%</td>
                              <td className="px-6 py-4 text-right font-mono">{e.testsAttempted}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold font-outfit">Your Test Series</h2>
              <p className="text-xs text-muted-foreground">Pick a test series to open its leaderboard and see where you stand.</p>
            </div>

            {seriesList.length === 0 ? (
              <div className="text-center py-16 border rounded-3xl bg-card text-muted-foreground flex flex-col items-center gap-3">
                <GraduationCap className="w-10 h-10 opacity-30" />
                <p>You haven't enrolled in any test series yet.</p>
                <p className="text-xs">Enroll in a test series from your dashboard and it will appear here with your rank.</p>
                <Link href="/dashboard" className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-colors">
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {seriesList.map((s: any) => (
                  <Link
                    key={s.testSeriesId}
                    href={`/leaderboard?testSeriesId=${s.testSeriesId}`}
                    className="p-5 rounded-3xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base font-outfit truncate">{s.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary shrink-0">{s.examName}</span>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                        <span>{s.testsCount} tests</span>
                        <span>{s.testsAttempted} attempted</span>
                        <span>{s.totalParticipants} participants</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {s.hasAttempted ? (
                        <div>
                          <div className="text-[10px] text-muted-foreground">Your rank</div>
                          <div className="text-2xl font-black font-outfit text-primary">#{s.myRank}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Not attempted yet</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS Analytics Engine.
      </footer>
    </div>
  );
}

export default function LeaderboardPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading...</div>}>
      <LeaderboardPage />
    </Suspense>
  );
}

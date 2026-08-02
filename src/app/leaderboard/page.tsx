'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const seriesId = searchParams.get('testSeriesId');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId && !seriesId) {
      setError('No test or test series selected.');
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const endpoint = testId ? `/leaderboard/test/${testId}?limit=50` : `/leaderboard/series/${seriesId}?limit=50`;
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard.');
      }
      setLoading(false);
    };
    load();
  }, [testId, seriesId]);

  const entries = data?.entries || [];
  const title = testId ? data?.test?.title : data?.series?.title;
  const myEntry = data?.myEntry;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
          </h1>
        </div>
        <span className="text-xs text-muted-foreground">{testId ? 'Per Test' : 'Per Test Series'}</span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leaderboard...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500 font-semibold">{error}</div>
        ) : (
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
                      {entries.map((e: any) => {
                        const isMe = testId ? e.rank === myEntry?.rank && e.studentName === 'Anonymous' : e.studentId === data?.series?._id;
                        return (
                          <tr key={e.rank} className={`border-b border-border hover:bg-muted/50 transition-colors ${isMe ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black font-mono text-xs ${e.rank === 1 ? 'bg-amber-500 text-white' : e.rank === 2 ? 'bg-slate-400 text-white' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-secondary text-muted-foreground'}`}>{e.rank}</span>
                            </td>
                            <td className="px-6 py-4 font-bold">{e.studentName}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

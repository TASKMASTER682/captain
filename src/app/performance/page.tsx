'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getAuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, LogOut, Sun, Moon, Loader2, ClipboardList, BarChart3, Trophy, Target } from 'lucide-react';

export default function PerformancePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const activeUser = getAuthUser();
    if (!activeUser) return;
    try {
      const res = await api.get('/attempts/history').catch(() => ({ data: [] }));
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) {
      router.push('/login');
      return;
    }
    setUser(activeUser);
    loadData();
  }, [router, loadData]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const attempts = history;

  // Chronological trend (oldest -> latest)
  const chartData = [...attempts].reverse().map((h: any, i: number) => ({
    name: h.testId?.title?.length > 16 ? h.testId.title.slice(0, 14) + '…' : (h.testId?.title || `Test ${i + 1}`),
    score: h.score || 0,
    accuracy: Math.round(h.accuracy || 0),
    percentile: Math.round(h.percentile ?? 0),
  }));

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const avgScore = Math.round(avg(attempts.map((h: any) => h.score || 0)));
  const bestScore = attempts.length ? Math.max(...attempts.map((h: any) => h.score || 0)) : 0;
  const avgAccuracy = Math.round(avg(attempts.map((h: any) => h.accuracy || 0)));
  const avgPercentile = Math.round(avg(attempts.map((h: any) => h.percentile ?? 0)));

  // Subject-wise accuracy aggregated from section analysis
  const subjectAgg: Record<string, { accuracy: number; count: number }> = {};
  attempts.forEach((h: any) => {
    (h.sectionAnalysis || []).forEach((s: any) => {
      const k = s.sectionName || 'General';
      if (!subjectAgg[k]) subjectAgg[k] = { accuracy: 0, count: 0 };
      subjectAgg[k].accuracy += s.accuracy || 0;
      subjectAgg[k].count += 1;
    });
  });
  const subjectData = Object.entries(subjectAgg)
    .map(([name, v]) => ({ name, accuracy: Math.round(v.accuracy / v.count) }))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading performance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" aria-label="Back to Dashboard" className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="shrink-0" aria-label="ExamOS home">
              <img src="/logo.png" alt="ExamOS" className="w-10 h-10 rounded-xl shadow-md shadow-primary/20 object-cover" />
            </Link>
            <span className="font-bold text-xl tracking-tight font-outfit">My Performance</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.role} Candidate</div>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl border border-border bg-card text-rose-500 hover:bg-rose-500/10 transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

        {attempts.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
            <span className="font-bold font-outfit">No test attempts yet</span>
            <span className="text-sm text-muted-foreground">Complete your first mock test to see your performance graphs here.</span>
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95">Go to Dashboard</Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">Tests Attempted</span>
                  <span className="text-lg sm:text-2xl font-bold font-outfit text-primary">{attempts.length}</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">Avg Score</span>
                  <span className="text-lg sm:text-2xl font-bold font-outfit text-indigo-500">{avgScore} pts</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">Best Score</span>
                  <span className="text-lg sm:text-2xl font-bold font-outfit text-amber-500">{bestScore} pts</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">Avg Accuracy</span>
                  <span className="text-lg sm:text-2xl font-bold font-outfit text-emerald-500">{avgAccuracy}%</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 truncate">Avg percentile {avgPercentile}%ile</span>
                </div>
              </div>
            </div>

            {/* Score & Percentile trend */}
            <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <h3 className="text-base font-bold font-outfit flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Score & Percentile Trend
              </h3>
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" name="Score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="percentile" name="Percentile" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Accuracy trend */}
            <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <h3 className="text-base font-bold font-outfit flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" /> Accuracy Trend
              </h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject-wise accuracy */}
            {subjectData.length > 0 && (
              <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
                <h3 className="text-base font-bold font-outfit flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" /> Subject-wise Accuracy
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="accuracy" name="Accuracy %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent attempts */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" /> Recent Attempts
              </h2>
              <div className="border border-border rounded-3xl overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Test Title</th>
                        <th className="px-6 py-4">Completed On</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Accuracy</th>
                        <th className="px-6 py-4">Percentile</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.slice(0, 10).map((h: any) => (
                        <tr key={h._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-semibold">{h.testId?.title || 'Mock Test'}</td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(h.submittedAt || h.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-primary">{h.score} pts</td>
                          <td className="px-6 py-4 font-medium text-indigo-500">{Math.round(h.accuracy)}%</td>
                          <td className="px-6 py-4 font-medium text-emerald-500">{h.percentile}%ile</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/cbt/results/${h._id}`} className="inline-flex px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors">
                              View Report
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>

    </div>
  );
}
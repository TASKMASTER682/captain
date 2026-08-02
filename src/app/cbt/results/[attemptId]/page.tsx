'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Award, BarChart2, CheckCircle2, ChevronRight, HelpCircle, 
  RefreshCw, TrendingUp, AlertTriangle, ArrowLeft, Lightbulb,
  Layers, Target, Trophy, Crown, Medal
} from 'lucide-react';
import Link from 'next/link';

// Simple lightweight SVG-based micro-charts to prevent chart rendering crashes in pure headless engines
export default function AttemptResults() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [telemetryTab, setTelemetryTab] = useState<'all' | 'wrong'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [toppers, setToppers] = useState<any[]>([]);
  const [myEntry, setMyEntry] = useState<any>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/results`);
        setData(res.data);
        const testId = res.data?.attempt?.testId?._id;
        if (testId) {
          try {
            const lb = await api.get(`/leaderboard/test/${testId}?limit=5`);
            setToppers(lb.data?.entries || []);
            setMyEntry(lb.data?.myEntry || null);
          } catch (_) { /* leaderboard optional */ }
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load attempt results', err);
        setLoading(false);
      }
    };

    loadResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-xl font-bold">Report not found</h3>
        <Link href="/dashboard" className="mt-4 px-4 py-2 bg-primary text-white rounded-xl">Back to Dashboard</Link>
      </div>
    );
  }

  const { attempt, analytics } = data;
  const test = attempt.testId || {};

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Header bar */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-outfit">Performance Analytics Report</h1>
        </div>
        <span className="text-xs text-muted-foreground font-mono">ID: {attempt._id}</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Banner Card - Main Score & Rank Gauges */}
        <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Test Completed</span>
            <h2 className="text-2xl font-extrabold font-outfit">{test.title || 'Mock Test'}</h2>
            <span className="text-xs text-muted-foreground mt-1">Submitted on {new Date(attempt.submittedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-border/50 pl-6">
            <span className="text-xs text-muted-foreground">Scored Points</span>
            <span className="text-3xl font-black font-outfit text-primary">{attempt.score} <span className="text-sm font-semibold text-muted-foreground">pts</span></span>
            <span className="text-xs text-muted-foreground">Accuracy: {Math.round(attempt.accuracy)}%</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-border/50 pl-6">
            <span className="text-xs text-muted-foreground">Test Rank</span>
            <span className="text-3xl font-black font-outfit text-indigo-500">#{attempt.rank ? attempt.rank : '-'} <span className="text-sm font-semibold text-muted-foreground">rank</span></span>
            <span className="text-xs text-muted-foreground">Percentile: {attempt.percentile}%ile</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-border/50 pl-6">
            <span className="text-xs text-muted-foreground">EER Readiness Index</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black font-outfit text-emerald-500">{analytics.examReadinessScore}%</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            </div>
            <span className={`text-xs font-semibold ${analytics.examReadinessScore >= 70 ? 'text-emerald-500/80' : 'text-amber-500/80'}`}>
              {analytics.examReadinessScore >= 70 ? 'Ready for actual exam' : 'Needs improvement'}
            </span>
          </div>
        </div>

        {/* Toppers / Leaderboard Section */}
        <div className="p-8 rounded-3xl border border-border bg-card flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Toppers
            </h3>
            {test._id && (
              <Link href={`/leaderboard?testId=${test._id}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My standing */}
            {myEntry && (
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Your Standing
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-outfit text-primary">#{myEntry.rank}</span>
                  <span className="text-xs text-muted-foreground">of this test's candidates</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Score: <b className="text-foreground">{myEntry.score}</b></span>
                  <span>Percentile: <b className="text-foreground">{myEntry.percentile}%ile</b></span>
                </div>
              </div>
            )}

            {/* Top 5 toppers */}
            <div className="flex flex-col gap-2">
              {toppers.length === 0 ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2 h-full justify-center">
                  <Medal className="w-4 h-4 opacity-50" /> No submissions yet — be the first to top this test.
                </div>
              ) : (
                toppers.map((t: any, i: number) => {
                  const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-600'];
                  return (
                    <div key={t.attemptId} className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${i === 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-background/50'}`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                      <span className={`font-bold truncate ${t.rank === myEntry?.rank ? 'text-primary' : ''}`}>{t.studentName}</span>
                      {t.rank === myEntry?.rank && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">YOU</span>}
                      <div className="ml-auto flex items-center gap-3 text-muted-foreground">
                        <span>{t.score} pts</span>
                        <span className="font-mono font-bold text-foreground">{Math.round(t.accuracy)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed Analytics Grid (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Subject Breakdown Charts */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" /> Subject Proficiency Matrix
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.subjectBreakdown.map((sub: any) => (
                  <div key={sub.name} className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-3">
                    <span className="text-xs font-bold text-muted-foreground line-clamp-1">{sub.name}</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-black font-outfit">{Math.round(sub.accuracy)}%</span>
                      <span className="text-xs text-muted-foreground">{sub.correct} / {sub.attempted} Correct</span>
                    </div>

                    {/* Custom clean SVG-based Progress bar */}
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent" 
                        style={{ width: `${sub.accuracy}%` }}
                      ></div>
                    </div>

                    <span className="text-[10px] text-muted-foreground">Average Solving Speed: {Math.round(sub.timeSpent / (sub.attempted || 1))}s/q</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Breakdown */}
            {analytics.topicBreakdown && analytics.topicBreakdown.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" /> Topic-wise Performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analytics.topicBreakdown.map((topic: any) => (
                    <div key={topic.name} className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold line-clamp-1">{topic.name}</span>
                        <span className="text-xs font-mono font-bold text-primary">{Math.round(topic.accuracy)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: `${topic.accuracy}%` }}></div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{topic.correct}/{topic.attempted} correct &middot; {topic.timeSpent}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Breakdown */}
            {analytics.difficultyBreakdown && analytics.difficultyBreakdown.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" /> Difficulty-wise Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {analytics.difficultyBreakdown.map((diff: any) => {
                    const colors: any = { Easy: 'text-emerald-500', Medium: 'text-amber-500', Hard: 'text-rose-500' };
                    return (
                      <div key={diff.level} className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors[diff.level] || 'text-muted-foreground'}`}>
                          {diff.level}
                        </span>
                        <span className="text-2xl font-black font-outfit">{Math.round(diff.accuracy)}%</span>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${diff.accuracy >= 70 ? 'bg-emerald-500' : diff.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${diff.accuracy}%` }}></div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{diff.correct}/{diff.total} correct &middot; {diff.timeSpent}s spent</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Questions Timeline / Breakdown log */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Question-by-Question Telemetry
              </h3>

              {/* Tab Switcher */}
              <div className="flex gap-2">
                <button 
                  onClick={() => { setTelemetryTab('all'); setExpandedRows(new Set()); }} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${telemetryTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                >
                  All Questions ({attempt.answers.length})
                </button>
                <button 
                  onClick={() => { setTelemetryTab('wrong'); setExpandedRows(new Set()); }} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${telemetryTab === 'wrong' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                >
                  Wrong Questions ({attempt.answers.filter((a: any) => a.selectedAnswer.length > 0 && !a.isCorrect).length})
                </button>
              </div>

              <div className="border border-border rounded-3xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Q.No</th>
                        <th className="px-6 py-4">Topic / Subject</th>
                        <th className="px-6 py-4">Time Spent</th>
                        <th className="px-6 py-4">Selected</th>
                        <th className="px-6 py-4 text-center">Outcome</th>
                        <th className="px-6 py-4 text-right">Points</th>
                        <th className="px-6 py-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(telemetryTab === 'all' ? attempt.answers : attempt.answers.filter((a: any) => a.selectedAnswer.length > 0 && !a.isCorrect)).map((ans: any, index: number) => {
                        const qIndex = attempt.answers.indexOf(ans);
                        const isExpanded = expandedRows.has(qIndex);
                        return (
                          <React.Fragment key={ans._id}>
                            <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-primary font-mono">{qIndex + 1}</td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-xs leading-tight line-clamp-1">{ans.questionId?.body}</div>
                                <span className="text-[10px] text-muted-foreground font-mono">{ans.questionId?.subject} &bull; {ans.questionId?.topic}</span>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs">{ans.timeSpent}s</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded bg-secondary font-mono text-xs font-semibold">
                                  {ans.selectedAnswer.join(', ') || 'Skipped'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {ans.selectedAnswer.length === 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">SKIPPED</span>
                                ) : ans.isCorrect ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">CORRECT</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">WRONG</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-bold font-mono text-xs text-primary">
                                {ans.marksObtained > 0 ? `+${ans.marksObtained}` : ans.marksObtained}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => {
                                    const next = new Set(expandedRows);
                                    if (next.has(qIndex)) next.delete(qIndex); else next.add(qIndex);
                                    setExpandedRows(next);
                                  }} 
                                  className="p-1 rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-border bg-muted/30">
                                <td colSpan={7} className="px-6 py-5">
                                  <div className="flex flex-col gap-3 text-sm">
                                    <div>
                                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Correct Answer</span>
                                      <p className="mt-1 font-bold font-mono">{(ans.questionId?.correctAnswer || []).join(', ') || 'N/A'}</p>
                                    </div>
                                    {ans.questionId?.explanation && (
                                      <div>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Explanation</span>
                                        <p className="mt-1 text-muted-foreground whitespace-pre-line">{ans.questionId.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {telemetryTab === 'wrong' && attempt.answers.filter((a: any) => a.selectedAnswer.length > 0 && !a.isCorrect).length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold">No wrong answers! Perfect score.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Recommendations / Next steps (1/3 width) */}
          <div className="flex flex-col gap-6">
            
            {/* Weak/Strong Areas Alerts */}
            <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Focus Diagnosis
              </h3>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-rose-500">WEAK TOPICS (Accuracy &lt; 50%)</span>
                {analytics.weakAreas.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Excellent! No severe weak areas diagnosed.</span>
                ) : (
                  analytics.weakAreas.map((area: any) => (
                    <div key={area.topic} className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex justify-between items-center text-xs">
                      <span className="font-bold">{area.topic}</span>
                      <span className="text-rose-500 font-mono font-bold">{Math.round(area.accuracy)}% Acc</span>
                    </div>
                  ))
                )}

                <div className="border-t border-border/50 my-2"></div>

                <span className="text-xs font-semibold text-emerald-500">STRONG TOPICS (Accuracy &ge; 75%)</span>
                {analytics.strongAreas.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Keep practicing to establish high-accuracy mastery tags.</span>
                ) : (
                  analytics.strongAreas.map((area: any) => (
                    <div key={area.topic} className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex justify-between items-center text-xs">
                      <span className="font-bold">{area.topic}</span>
                      <span className="text-emerald-500 font-mono font-bold">{Math.round(area.accuracy)}% Acc</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommendation assignments */}
            <div className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col gap-4 shadow-sm">
              <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" /> Adaptive Practice Directives
              </h3>

              {analytics.weakAreas.length > 0 ? (
                <div className="p-4 rounded-2xl border-2 border-rose-500/20 bg-rose-500/5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-[10px] font-bold text-rose-500 uppercase tracking-wider">DRILL DOWN</span>
                    <span className="text-[11px] text-muted-foreground">{analytics.weakAreas.length} weak topic{analytics.weakAreas.length > 1 ? 's' : ''} to practice</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Click a topic below to start a practice set:</p>
                  <div className="flex flex-col gap-1.5">
                    {analytics.weakAreas.map((area: any) => (
                      <Link
                        key={area.topic}
                        href={`/practice?subject=${encodeURIComponent(attempt.answers.find((a:any) => a.questionId.topic === area.topic)?.questionId.subject || '')}&topic=${encodeURIComponent(area.topic)}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-rose-500/30 hover:bg-rose-500/5 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60"></div>
                          <span className="text-xs font-bold group-hover:text-rose-500 transition-colors">{area.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-rose-500">{Math.round(area.accuracy)}% Acc</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-wider inline-block w-fit">SPEED UP</span>
                  <h4 className="font-bold text-xs">Advanced Custom Practice</h4>
                  <p className="text-[11px] text-muted-foreground">Your accuracy is solid. Try setting up hard difficulty filters to test your speed limits.</p>
                  <Link 
                    href="/practice" 
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center mt-1"
                  >
                    Open practice deck →
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS Analytics Engine.
      </footer>

    </div>
  );
}

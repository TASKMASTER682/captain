'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getAuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Flame, Calendar, BookOpen, Clock, BrainCircuit, BarChart3,
  Play, ClipboardList, LogOut, Sun, Moon, Sparkles, BookMarked,
  Target, Zap, AlertCircle, RotateCcw,
  Building2, GraduationCap, Settings, Loader2, CheckCircle, PlusCircle, XCircle, TrendingUp, AlertTriangle,
  Star, UserCheck, Users, CreditCard, Lock, Megaphone, Copy, Crown,
  FolderOpen, Trophy, Receipt, User, HelpCircle, Newspaper, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function getRecMeta(type: string): { icon: LucideIcon; border: string; bg: string; iconBg: string; iconColor: string; badgeColor: string; badgeBg: string; linkColor: string; actionLabel: string } {
  switch (type) {
    case 'Topic Practice':
      return {
        icon: Target, border: 'border-rose-500/20', bg: 'bg-rose-500/[0.03]',
        iconBg: 'bg-rose-500/10', iconColor: 'text-rose-500',
        badgeColor: 'text-rose-500', badgeBg: 'bg-rose-500/10',
        linkColor: 'text-rose-500', actionLabel: 'Start Practice',
      };
    case 'Speed Boost':
      return {
        icon: Zap, border: 'border-amber-500/20', bg: 'bg-amber-500/[0.03]',
        iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500',
        badgeColor: 'text-amber-600', badgeBg: 'bg-amber-500/10',
        linkColor: 'text-amber-600', actionLabel: 'Improve Speed',
      };
    case 'Mock Test Focus':
      return {
        icon: AlertCircle, border: 'border-violet-500/20', bg: 'bg-violet-500/[0.03]',
        iconBg: 'bg-violet-500/10', iconColor: 'text-violet-500',
        badgeColor: 'text-violet-500', badgeBg: 'bg-violet-500/10',
        linkColor: 'text-violet-500', actionLabel: 'Review Results',
      };
    case 'General Revision':
      return {
        icon: RotateCcw, border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.03]',
        iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500',
        badgeColor: 'text-emerald-600', badgeBg: 'bg-emerald-500/10',
        linkColor: 'text-emerald-600', actionLabel: 'Start Revision',
      };
    default:
      return {
        icon: Sparkles, border: 'border-primary/20', bg: 'bg-primary/[0.03]',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
        badgeColor: 'text-primary', badgeBg: 'bg-primary/10',
        linkColor: 'text-primary', actionLabel: 'Get Started',
      };
  }
}

export default function StudentDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);

  // Enrolled test series (populated objects)
  const [enrolledSeries, setEnrolledSeries] = useState<any[]>([]);
  // IDs of enrolled series for quick lookup
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  // Enrolling/unenrolling state per test series ID
  const [enrolling, setEnrolling] = useState<Set<string>>(new Set());

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesTests, setSeriesTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 10;
  const [recs, setRecs] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>({ streak: 0, questionsToday: 0, timeSpentToday: 0, scoreAvg: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userAgencies, setUserAgencies] = useState<any[]>([]);
  const [userExams, setUserExams] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const activeUser = getAuthUser();
    if (!activeUser) return;
    try {
      const userAgencyIds = activeUser?.agencies || [];
      const userExamIds = activeUser?.exams || [];

      // Skip member-only analytics calls for users without an active subscription
      const hasActiveSub =
        activeUser?.subscription?.status === 'active' &&
        (!activeUser?.subscription?.expiresAt || new Date(activeUser.subscription.expiresAt) > new Date());
      if (!hasActiveSub) setAnalyticsLocked(true);
      const lockedAnalytics = hasActiveSub
        ? api.get('/my-analytics/weak-areas').catch((e: any) => { if (e?.status === 403) setAnalyticsLocked(true); return { data: [] }; })
        : Promise.resolve({ data: [] });
      const lockedTrends = hasActiveSub
        ? api.get('/my-analytics/trends?months=6').catch((e: any) => { if (e?.status === 403) setAnalyticsLocked(true); return { data: [] }; })
        : Promise.resolve({ data: [] });

      const [enrolledRes, histRes, recRes, weakRes, dailyRes, trendRes, gamRes, subjRes, allAgenciesRes, allExamsRes, bookmarkRes, annRes] = await Promise.all([
        api.get('/enrollments/me').catch(() => ({ data: [] })),
        api.get('/attempts/history').catch(() => ({ data: [] })),
        api.get('/practice/recommendations').catch(() => ({ data: [] })),
        lockedAnalytics,
        api.get('/my-analytics/daily-stats').catch(() => ({ data: null })),
        lockedTrends,
        api.get('/my-analytics/gamification').catch(() => ({ data: null })),
        api.get('/practice/subjects').catch(() => ({ data: [] })),
        api.get('/agencies').catch(() => ({ data: [] })),
        api.get('/exams').catch(() => ({ data: [] })),
        api.get('/bookmarks').catch(() => ({ data: [] })),
        api.get('/announcements/active').catch(() => ({ data: [] })),
      ]);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);

      const agencies = Array.isArray(allAgenciesRes.data) ? allAgenciesRes.data : [];
      const exams = Array.isArray(allExamsRes.data) ? allExamsRes.data : [];
      setUserAgencies(agencies.filter((a: any) => userAgencyIds.includes(a._id)));
      setUserExams(exams.filter((e: any) => userExamIds.includes(e._id)));

      const enrolledTs = Array.isArray(enrolledRes.data) ? enrolledRes.data : [];
      const enrolledTsIds: Set<string> = new Set(enrolledTs.map((e: any) => e.testSeriesId?._id || e.testSeriesId).filter(Boolean));
      const enrolledTsObjects = enrolledTs
        .map((e: any) => ({ ts: e.testSeriesId, at: new Date(e.enrolledAt || e.createdAt || 0).getTime() }))
        .filter((x: any) => x.ts)
        .sort((a: any, b: any) => b.at - a.at)
        .map((x: any) => x.ts);
      setEnrolledIds(enrolledTsIds);
      setEnrolledSeries(enrolledTsObjects);

      const historyData = Array.isArray(histRes.data) ? histRes.data : [];
      setHistory(historyData);
      setHistoryPage(0);

      const recData = Array.isArray(recRes.data) ? recRes.data : [];
      setRecs(recData);

      const weakData = Array.isArray(weakRes.data) ? weakRes.data : [];
      setWeakAreas(weakData);

      setDailyStats(dailyRes.data || { streak: 0, questionsToday: 0, timeSpentToday: 0, scoreAvg: 0 });
      setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      setGamification(gamRes.data || null);
      setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      setBookmarks(Array.isArray(bookmarkRes.data) ? bookmarkRes.data : []);
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const toggleEnroll = async (seriesId: string) => {
    if (enrolling.has(seriesId)) return;
    const ts = enrolledSeries.find((t: any) => t._id === seriesId);
    if (ts && ts.price > 0) return; // paid series can't be unenrolled
    setEnrolling(prev => new Set(prev).add(seriesId));
    try {
      await api.delete(`/enrollments/unenroll/${seriesId}`);
      setEnrolledIds(prev => { const n = new Set(prev); n.delete(seriesId); return n; });
      setEnrolledSeries(prev => prev.filter((t: any) => t._id !== seriesId));
    } catch {}
    setEnrolling(prev => { const n = new Set(prev); n.delete(seriesId); return n; });
  };

  const toggleSeries = async (seriesId: string) => {
    if (expandedSeriesId === seriesId) {
      setExpandedSeriesId(null);
      setSeriesTests([]);
      return;
    }
    setExpandedSeriesId(seriesId);
    setLoadingTests(true);
    try {
      const res = await api.get(`/tests?testSeriesId=${seriesId}`);
      setSeriesTests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSeriesTests([]);
    }
    setLoadingTests(false);
  };

  function renderTestSeriesCard(ts: any, isEnrolled: boolean) {
    const isBusy = enrolling.has(ts._id);
    const isPaid = ts.price > 0;
    const showBuy = isPaid && !isEnrolled;
    return (
      <div key={ts._id} className="rounded-3xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => toggleSeries(ts._id)}
        >
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/10">
                {ts.examId?.name || 'Exam'}
              </span>
              {ts.price === 0 ? (
                <span className="text-[10px] font-semibold text-emerald-600 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Free
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-600 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/10 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> ₹{ts.price}
                </span>
              )}
              {isEnrolled && (
                <span className="text-[10px] font-semibold text-violet-600 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/10 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Enrolled
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg font-outfit mt-1">{ts.title}</h3>
            {ts.description && <p className="text-xs text-muted-foreground line-clamp-2">{ts.description}</p>}
            {ts.tags && ts.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ts.tags.map((tag: string) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEnrolled && isPaid ? (
              <span className="px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 border border-violet-500/30 text-violet-600 bg-violet-500/5">
                <CheckCircle className="w-3.5 h-3.5" /> Enrolled
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); toggleEnroll(ts._id); }}
                disabled={isBusy}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isEnrolled
                    ? 'border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 bg-rose-500/5'
                    : showBuy
                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20'
                    : 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20'
                } disabled:opacity-50`}
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEnrolled ? <XCircle className="w-3.5 h-3.5" /> : showBuy ? <Lock className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                {isBusy ? '' : isEnrolled ? 'Unenroll' : showBuy ? 'Buy Full Series' : 'Enroll'}
              </button>
            )}
            <span className="text-xs text-muted-foreground font-semibold">{expandedSeriesId === ts._id ? '▲' : '▼'}</span>
          </div>
        </div>

        {expandedSeriesId === ts._id && (
          <div className="border-t border-border bg-muted/10 p-5">
            {loadingTests ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
                Loading tests...
              </div>
            ) : seriesTests.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No tests in this series yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {seriesTests.map((test) => (
                  <div key={test._id} className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col gap-1 flex-1">
                      <h4 className="font-bold text-sm font-outfit flex items-center gap-2">{test.title}
                        {test.memberOnly && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold">MEMBERS</span>}
                        {test.isFree && !test.memberOnly && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">FREE</span>}
                      </h4>
                      {test.description && <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration} min</span>
                        <span>Pass: {test.passingMode === 'auto' ? 'Auto (Merit)' : `${test.passingMarks}%`}</span>
                        <span>Sections: {test.sections?.length || 0}</span>
                        {test.attemptLimit ? <span>Attempts: {test.attemptLimit}</span> : null}
                        {test.availability?.status === 'scheduled' && test.availability?.opensAt && (
                          <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold">
                            Opens {new Date(test.availability.opensAt).toLocaleString()}
                          </span>
                        )}
                        {test.availability?.status === 'expired' && (
                          <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 text-[10px] font-bold">Closed</span>
                        )}
                        {test.availability?.status === 'available' && test.scheduled && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold animate-pulse">LIVE</span>
                        )}
                      </div>
                    </div>
                    {test.availability?.status === 'scheduled' ? (
                      <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground font-medium transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-not-allowed">
                        <Clock className="w-4 h-4" /> Not Started Yet
                      </div>
                    ) : test.availability?.status === 'expired' ? (
                      <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground font-medium transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-not-allowed">
                        <XCircle className="w-4 h-4" /> Closed
                      </div>
                    ) : (
                      <Link
                        href={test.isLocked ? '/plans' : `/cbt/${test._id}`}
                        onClick={(e) => test.isLocked && e.stopPropagation()}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                          test.isLocked
                            ? 'bg-amber-500 text-white hover:bg-amber-500/95 shadow-md shadow-amber-500/20'
                            : 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20'
                        }`}
                      >
                        {test.isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        {test.isLocked ? 'Upgrade to Unlock' : 'Start CBT'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages - 1);
  const historyStart = safeHistoryPage * HISTORY_PAGE_SIZE;
  const pagedHistory = history.slice(historyStart, historyStart + HISTORY_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary/20">Ω</div>
          <span className="font-bold text-xl tracking-tight font-outfit">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.role} Candidate</div>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl border border-border bg-card text-rose-500 hover:bg-rose-500/10 transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-8 pb-40 md:pb-8 flex flex-col gap-8">
        
        {/* Quick Nav */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/materials" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-primary" /> Study Materials
          </Link>
          <Link href="/leaderboard" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leaderboards
          </Link>
          <Link href="/doubts" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-violet-500" /> Doubts
          </Link>
          <Link href="/blogs" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-sky-500" /> Blogs
          </Link>
          <Link href="/orders" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-cyan-500" /> My Orders
          </Link>
          <Link href="/plans" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Plans & Pricing
          </Link>
          <Link href="/profile" className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-500" /> Profile
          </Link>
          <Link href="/performance" className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> My Performance
          </Link>
        </div>
        
        {/* Gamification */}
        {gamification && (
          <div className="p-5 rounded-3xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
                {gamification.level}
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level {gamification.level}</span>
                <div className="text-lg font-black font-outfit">{gamification.xp} XP</div>
                <div className="w-28 h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${gamification.levelProgress}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><Flame className="w-4 h-4 fill-rose-500" /> {gamification.streak}-day streak</span>
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Crown className="w-4 h-4 text-amber-500" /> Best: {gamification.bestStreak}</span>
              <div className="flex items-center gap-1.5">
                {gamification.badges.length > 0 ? gamification.badges.map((b: any) => (
                  <span key={b.code} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold" title={b.name}>🏅 {b.name}</span>
                )) : (
                  <span className="text-[10px] text-muted-foreground">Complete tests to earn badges!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {announcements.map((a: any) => {
              const accent = a.accentColor || '#6366f1';
              return (
                <div key={a._id} className="group flex items-start gap-3 p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform" style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}>
                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: `${accent}15`, color: accent }}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm font-outfit">{a.title}</span>
                      <span className="relative flex w-2 h-2 mt-0.5" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75 motion-reduce:animate-none" style={{ backgroundColor: accent }}></span>
                        <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: accent }}></span>
                      </span>
                    </div>
                    {a.message && <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Daily Goals Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-rose-500/5 rounded-full blur-lg"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-rose-500" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">Current Streak</span>
              <span className="text-lg sm:text-2xl font-bold font-outfit text-rose-500">{dailyStats.streak}-Day Streak</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 truncate">Keep learning daily!</span>
            </div>
          </div>
          <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-full blur-lg"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">Questions Today</span>
              <span className="text-lg sm:text-2xl font-bold font-outfit text-primary">{dailyStats.questionsToday} Qs</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 truncate">Attempted today</span>
            </div>
          </div>
          <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500/5 rounded-full blur-lg"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">Time Spent Today</span>
              <span className="text-lg sm:text-2xl font-bold font-outfit text-emerald-500">{Math.round(dailyStats.timeSpentToday / 60)} min</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 truncate">Active practice time</span>
            </div>
          </div>
          <Link href="/revision" className="p-4 sm:p-6 rounded-3xl border border-border bg-card flex items-center gap-3 sm:gap-4 relative overflow-hidden hover:border-primary transition-all group shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-500/5 rounded-full blur-lg"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground block">Avg Score</span>
              <span className="text-lg sm:text-2xl font-bold font-outfit text-indigo-500 group-hover:text-primary transition-colors">{Math.round(dailyStats.scoreAvg)}%</span>
              <span className="text-[10px] sm:text-xs text-primary font-bold block mt-0.5 truncate">Across all tests</span>
            </div>
          </Link>
        </div>

        {/* Members-only analytics upgrade prompt (desktop only — mobile bottom bar covers it) */}
        {analyticsLocked && (
          <div className="hidden md:flex p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Crown className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold font-outfit text-sm flex items-center gap-2">Deep Performance Analytics <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold">MEMBERS</span></h3>
                <p className="text-xs text-muted-foreground mt-1">Unlock monthly performance trends, accuracy charts and weak-area analysis with a paid plan.</p>
              </div>
            </div>
            <Link href="/plans" className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-500/95 shadow-md shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" /> Upgrade to Unlock
            </Link>
          </div>
        )}

        {/* Performance Trend Chart */}
        {trendData.length > 0 && (
          <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-outfit flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Performance Trends
              </h3>
              <span className="text-[10px] text-muted-foreground">Last {trendData.length} months</span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bestScore" name="Best Score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avgAccuracy" name="Avg Accuracy %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main body grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Preferences */}
            {(userAgencies.length > 0 || userExams.length > 0) ? (
              <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-outfit flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" /> Your Preferences
                  </h2>
                  <Link href="/profile" className="text-[10px] font-semibold text-primary hover:underline">Change →</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {userAgencies.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {userAgencies.map((a: any) => (
                          <span key={a._id} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 text-[11px] font-semibold border border-cyan-500/10">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userExams.length > 0 && (
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {userExams.map((e: any) => (
                          <span key={e._id} className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 text-[11px] font-semibold border border-violet-500/10">{e.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-3xl border border-dashed border-border bg-card shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-2">No agencies or exams selected yet.</p>
                <Link href="/profile" className="text-xs font-bold text-primary hover:underline">Select your preferences →</Link>
              </div>
            )}

            {/* Explore Test Series */}
            <Link
              href="/test-series"
              className="group p-5 rounded-3xl border border-border bg-card shadow-sm flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Star className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold font-outfit">Recommended Test Series</h2>
                  <p className="text-xs text-muted-foreground truncate">Browse recommended series & search for more</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* Enrolled Section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-500" /> Your Enrolled Test Series
              </h2>
              {enrolledSeries.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-2">
                  <UserCheck className="w-8 h-8 text-muted-foreground/30" />
                  <span>You haven't enrolled in any test series yet.</span>
                  <Link href="/test-series" className="text-xs font-bold text-primary hover:underline">Browse recommended test series →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {enrolledSeries.map((ts) => renderTestSeriesCard(ts, true))}
                </div>
              )}
            </div>

            {/* Previous Attempts */}
            <div id="submissions" className="flex flex-col gap-4 scroll-mt-24">
              <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" /> Previous Test Submissions
              </h2>
              <div className="border border-border rounded-3xl overflow-hidden bg-card shadow-sm">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
                    <span>No mock tests completed yet. Start your first attempt above.</span>
                  </div>
                ) : (
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
                        {pagedHistory.map((h) => (
                          <tr key={h._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 font-semibold">{h.testId?.title || 'Mock Test'}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              {new Date(h.submittedAt || h.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-bold text-primary">{h.score} pts</td>
                            <td className="px-6 py-4 font-medium text-indigo-500">{Math.round(h.accuracy)}%</td>
                            <td className="px-6 py-4 font-medium text-emerald-500">{h.percentile}%ile</td>
                            <td className="px-6 py-4 text-right">
                              <Link href={`/cbt/results/${h._id}`}
                                className="inline-flex px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors"
                              >View Report</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {history.length > HISTORY_PAGE_SIZE && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border gap-3">
                    <span className="text-xs text-muted-foreground">
                      Showing {historyStart + 1}–{Math.min(historyStart + HISTORY_PAGE_SIZE, history.length)} of {history.length} submissions
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                        disabled={safeHistoryPage === 0}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <span className="text-xs font-semibold text-muted-foreground">Page {safeHistoryPage + 1} of {totalHistoryPages}</span>
                      <button
                        onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages - 1, p + 1))}
                        disabled={safeHistoryPage >= totalHistoryPages - 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar (1/3) */}
          <div className="flex flex-col gap-6">
            
            {/* Bookmarked Questions */}
            <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-500" /> Bookmarked Questions
              </h2>
              {bookmarks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground flex flex-col items-center gap-2 py-4">
                  <BookMarked className="w-8 h-8 text-muted-foreground/30" />
                  <span className="text-xs">No bookmarked questions yet.</span>
                  <Link href="/practice" className="text-xs font-bold text-primary hover:underline">
                    Go to Practice →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {bookmarks.slice(0, 4).map((bm: any) => {
                    const q = bm.questionId || {};
                    return (
                      <Link 
                        key={bm._id}
                        href={`/practice?subject=${encodeURIComponent(q.subject || '')}&topic=${encodeURIComponent(q.topic || '')}`}
                        className="p-3 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug line-clamp-1">{q.body || 'Question'}</p>
                          <span className="text-[10px] text-muted-foreground">{q.subject}{q.subject && q.topic ? ' · ' : ''}{q.topic}</span>
                        </div>
                        <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                      </Link>
                    );
                  })}
                  {bookmarks.length > 4 && (
                    <Link href="/practice" className="text-xs font-bold text-primary hover:underline text-center pt-1">
                      View all {bookmarks.length} bookmarked →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div id="recommendations" className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col gap-4 shadow-sm relative overflow-hidden scroll-mt-24">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-md"></div>
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Smart Recommendations
              </h2>
              <p className="text-xs text-muted-foreground">Personalized study actions based on your performance data:</p>
              <div className="flex flex-col gap-3 mt-1">
                {recs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Complete a test to unlock personalized recommendations.</p>
                ) : (() => {
                  const topicRecs = recs.filter(r => r.type === 'Topic Practice');
                  const speedRecs = recs.filter(r => r.type === 'Speed Boost');
                  const otherRecs = recs.filter(r => r.type !== 'Topic Practice' && r.type !== 'Speed Boost');
                  return (<>
                    {topicRecs.length > 0 && (
                      <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4 text-rose-500" />
                          </div>
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10">Weak Topics</span>
                        </div>
                        <h4 className="font-bold text-sm leading-snug">Practice these topics to improve accuracy</h4>
                        <div className="flex flex-col gap-1.5">
                          {topicRecs.map((rec, i) => {
                            const topicName = rec.title.replace('Improve Accuracy: ', '');
                            return (
                              <Link key={i} href={rec.action}
                                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-background hover:bg-rose-500/5 border border-border hover:border-rose-500/20 transition-all group"
                              >
                                <span className="text-xs font-semibold group-hover:text-rose-500 transition-colors">{topicName}</span>
                                <span className="text-[10px] text-rose-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {speedRecs.length > 0 && (
                      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10">Slow Topics</span>
                        </div>
                        <h4 className="font-bold text-sm leading-snug">Improve solving speed on these topics</h4>
                        <div className="flex flex-col gap-1.5">
                          {speedRecs.map((rec, i) => {
                            const topicName = rec.title.replace('Optimize Timing: ', '');
                            return (
                              <Link key={i} href={rec.action}
                                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-background hover:bg-amber-500/5 border border-border hover:border-amber-500/20 transition-all group"
                              >
                                <span className="text-xs font-semibold group-hover:text-amber-600 transition-colors">{topicName}</span>
                                <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {otherRecs.map((rec, index) => {
                      const meta = getRecMeta(rec.type);
                      const Icon = meta.icon;
                      return (
                        <div key={index} className={`p-4 rounded-2xl border ${meta.border} ${meta.bg} flex flex-col gap-2.5`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${meta.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${meta.iconColor}`} />
                            </div>
                            <span className={`text-[10px] font-bold ${meta.badgeColor} uppercase tracking-wider px-2 py-0.5 rounded ${meta.badgeBg}`}>{rec.type}</span>
                          </div>
                          <h4 className="font-bold text-sm leading-snug">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                          <Link href={rec.action} className={`text-xs font-bold ${meta.linkColor} hover:underline mt-0.5 inline-flex items-center gap-1`}>
                            {meta.actionLabel} →
                          </Link>
                        </div>
                      );
                    })}
                  </>);
                })()}
              </div>
            </div>

            {/* Weak Areas */}
            {weakAreas.length > 0 && (
              <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
                <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" /> Areas Needing Attention
                </h2>
                <div className="flex flex-col gap-3">
                  {weakAreas.map((area: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex justify-between items-center text-xs">
                      <span className="font-bold">{area.topic || area.subject}</span>
                      <span className="text-rose-500 font-mono font-bold">{Math.round(area.accuracy)}% Acc</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infinite Practice */}
            <div id="infinite-practice" className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm scroll-mt-24">
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-500" /> Infinite Practice Module
              </h2>
              <p className="text-xs text-muted-foreground">Select a subject to start a randomized adaptive session:</p>
              {subjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">Enroll in a test series to unlock practice subjects for it.</p>
              ) : (
                subjects.slice(0, 6).map((s: string) => (
                  <Link key={s} href={`/practice?subject=${encodeURIComponent(s)}`}
                    className="w-full p-3 rounded-xl border border-border hover:border-indigo-500 bg-background text-left text-sm font-semibold transition-all hover:bg-indigo-500/5 block"
                  >{s}</Link>
                ))
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Mobile droplet quick-access bottom bar */}
      <nav aria-label="Quick access" className="md:hidden fixed bottom-0 inset-x-0 z-50">
        <div className="relative mx-2 mb-2 pb-[calc(env(safe-area-inset-bottom)+2px)]">
          <Link
            href="/plans"
            aria-label="Buy Test Series – view plans"
            className="absolute left-1/2 -translate-x-1/2 -top-7 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="flex flex-col items-center gap-0.5">
              <span className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-background animate-droplet">
                <Crown className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="text-[9px] font-bold text-primary whitespace-nowrap">Buy Test Series</span>
            </span>
          </Link>

          <div className="relative">
            <svg viewBox="0 0 120 16" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-4 w-full pointer-events-none" aria-hidden="true">
              <path d="M0 16 L0 0 L120 0 L120 16 Z M40 0 L48 16 L56 16 L64 0 Z" fillRule="evenodd" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
            </svg>
            <div className="rounded-t-[18px] rounded-b-2xl border border-border border-t-0 bg-card px-3 pt-7 pb-2 shadow-2xl shadow-black/20 flex items-end justify-between">
              <div className="flex items-end gap-1">
                <Link
                  href="/test-series"
                  className="flex flex-col items-center gap-1 w-16 py-1.5 rounded-xl hover:bg-secondary active:scale-95 transition-transform touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Open Recommended Test Series page"
                >
                  <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">For You</span>
                </Link>
                <button
                  onClick={() => scrollToSection('recommendations')}
                  className="flex flex-col items-center gap-1 w-16 py-1.5 rounded-xl hover:bg-secondary active:scale-95 transition-transform touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Go to Smart Recommendations section"
                >
                  <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Smart Recs</span>
                </button>
              </div>
              <div className="flex items-end gap-1">
                <button
                  onClick={() => scrollToSection('infinite-practice')}
                  className="flex flex-col items-center gap-1 w-16 py-1.5 rounded-xl hover:bg-secondary active:scale-95 transition-transform touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Go to Infinite Practice section"
                >
                  <BookMarked className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Practice</span>
                </button>
                <button
                  onClick={() => scrollToSection('submissions')}
                  className="flex flex-col items-center gap-1 w-16 py-1.5 rounded-xl hover:bg-secondary active:scale-95 transition-transform touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Go to Previous Test Submissions section"
                >
                  <ClipboardList className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">My Tests</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>

    </div>
  );
}

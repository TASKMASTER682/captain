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
  Target, Zap, AlertCircle, RotateCcw, CreditCard, Loader2, Lock, PlusCircle,
  Building2, GraduationCap, Settings, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  Star, UserCheck, Users, Megaphone, Copy, Crown,
  FolderOpen, Trophy, Receipt, User, HelpCircle, Newspaper, ChevronLeft, ChevronRight, LayoutDashboard, ArrowRight, ChevronDown
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { useExploreAgencyId } from '@/components/AgencyContext';
import AgencyPicker from '@/components/AgencyPicker';
import GlobalSearch from '@/components/GlobalSearch';
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
  // Context-free subscription — immune to module-instance mismatches.
  const exploreAgencyId = useExploreAgencyId();

  const [user, setUser] = useState<any>(null);
  const [allAgencyList, setAllAgencyList] = useState<any[]>([]);

  const [hotSeries, setHotSeries] = useState<any[]>([]);

  // Enrolled test series (populated objects)
  const [enrolledSeries, setEnrolledSeries] = useState<any[]>([]);
  // IDs of enrolled series for quick lookup
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  // Enrolling/unenrolling state per test series ID
  const [enrolling, setEnrolling] = useState<Set<string>>(new Set());

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesTests, setSeriesTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

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
  const [showStats, setShowStats] = useState(false);
  const [featuredSeries, setFeaturedSeries] = useState<any[]>([]);
  const [agencyExams, setAgencyExams] = useState<any[]>([]);
  const [showAllExams, setShowAllExams] = useState(false);
  const [examGridCols, setExamGridCols] = useState(3);

  // Collapsed view shows max 2 rows — track the responsive grid column count.
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setExamGridCols(6);
      else if (window.innerWidth >= 640) setExamGridCols(4);
      else setExamGridCols(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const examCollapsedLimit = examGridCols * 2;

  // Agency whose exams are shown. The picker's pick wins; otherwise fall back
  // to the user's own preference agencies (fresh from the server, so a stale
  // cached user object in localStorage can't hide the section).
  const preferredAgencyId = exploreAgencyId || userAgencies[0]?._id || null;

  // Exams under the agency currently being explored (UI-only —
  // preferences are untouched). Re-fetched whenever the pick changes.
  useEffect(() => {
    if (!preferredAgencyId) {
      setAgencyExams([]);
      return;
    }
    setShowAllExams(false);
    let cancelled = false;
    api.get(`/exams?agencyId=${preferredAgencyId}`)
      .then((res: any) => {
        if (!cancelled) setAgencyExams(Array.isArray(res.data) ? res.data.filter((e: any) => e.active !== false) : []);
      })
      .catch(() => {
        if (!cancelled) setAgencyExams([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredAgencyId]);

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

      const [enrolledRes, recRes, weakRes, dailyRes, trendRes, gamRes, subjRes, allAgenciesRes, allExamsRes, bookmarkRes, annRes, featRes] = await Promise.all([
        api.get('/enrollments/me').catch(() => ({ data: [] })),
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
        api.get('/test-series?featured=true').catch(() => ({ data: [] })),
      ]);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);
      setFeaturedSeries((Array.isArray(featRes.data) ? featRes.data : []).slice(0, 10));

      const agencies = Array.isArray(allAgenciesRes.data) ? allAgenciesRes.data : [];
      const exams = Array.isArray(allExamsRes.data) ? allExamsRes.data : [];
      setAllAgencyList(agencies);
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

      const recData = Array.isArray(recRes.data) ? recRes.data : [];
      setRecs(recData);

      const weakData = Array.isArray(weakRes.data) ? weakRes.data : [];
      setWeakAreas(weakData);

      setDailyStats(dailyRes.data || { streak: 0, questionsToday: 0, timeSpentToday: 0, scoreAvg: 0 });
      setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      // Only accept a proper payload — an empty array or junk must not render the widget.
      setGamification(gamRes.data && typeof gamRes.data === 'object' && !Array.isArray(gamRes.data) ? gamRes.data : null);
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

  function renderFeaturedCard(s: any) {
    const isBusy = enrolling.has(s._id);
    const isPaid = (s.price || 0) > 0;
    return (
      <div key={s._id} className="min-w-[260px] sm:min-w-[300px] max-w-[320px] shrink-0 snap-start">
        <Link href={`/explore/${s._id}`} className="block h-full group">
          <div className="h-full rounded-3xl border border-border bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/15 hover:border-primary/40 transition-all flex flex-col relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {s.banner ? (
              <div className="w-full h-28 overflow-hidden relative">
                <img src={s.banner} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {s.price > 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/30">₹{s.price}</span>
                )}
              </div>
            ) : (
              <div className="w-full h-28 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center relative">
                <GraduationCap className="w-10 h-10 text-primary/30" />
                {s.price > 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/30">₹{s.price}</span>
                )}
              </div>
            )}
            <div className="p-4 flex flex-col gap-2 flex-1">
              <h3 className="font-bold text-sm font-outfit line-clamp-2 group-hover:text-primary transition-colors">{s.title}</h3>
              {s.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                {s.examId?.name && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{s.examId.name}</span>
                )}
                {s.tags?.slice(0, 2).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

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

  // No saved agencies/exams yet (fresh signup) → red "Set Preferences" button
  // replaces the agency picker until preferences exist.
  const needsPreferences = userAgencies.length === 0 && userExams.length === 0;

  return (
    <StudentLayout user={user}>

      {/* Global search + Agency explorer — pick an agency to browse its exams (preferences untouched) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {needsPreferences ? (
          <Link
            href="/profile"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:border-rose-500 hover:text-white text-sm font-bold transition-all shadow-sm group animate-pulse-border"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Set Your Preferences
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div className="shrink-0">
            <AgencyPicker />
          </div>
        )}
        <GlobalSearch className="w-full sm:w-auto sm:flex-1 sm:max-w-xl sm:ml-auto" />
      </div>
        
        {/* Gamification */}
        {gamification && typeof gamification === 'object' && !Array.isArray(gamification) && (
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
                {Array.isArray(gamification.badges) && gamification.badges.length > 0 ? gamification.badges.map((b: any) => (
                  <span key={b.code} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold" title={b.name}>🏅 {b.name}</span>
                )) : (
                  <span className="text-[10px] text-muted-foreground">Complete tests to earn badges!</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="shrink-0 p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-all"
              title={showStats ? 'Hide daily stats' : 'Show daily stats'}
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showStats ? 'rotate-180' : ''}`} />
            </button>
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
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 overflow-hidden transition-all duration-300 ${showStats ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
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

        {/* Hot Test Series */}
        {hotSeries.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" /> Hot Test Series
              </h2>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scroll">
              {hotSeries.slice(0, 10).map((ts: any) => (
                <div key={ts._id} className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start">
                  <div className="rounded-3xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all group flex flex-col h-full">
                    {ts.banner ? (
                      <div className="w-full h-32 overflow-hidden relative">
                        <img src={ts.banner} alt={ts.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-3 left-4 text-white text-xs font-bold flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Featured
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="text-white text-xs font-bold flex items-center gap-1.5 relative z-10 drop-shadow-md">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Featured
                        </div>
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1 gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/10">
                          {ts.examId?.name || 'Exam'}
                        </span>
                        {ts.price === 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-600 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">
                            Free
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/10">
                            ₹{ts.price}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base font-outfit line-clamp-2 leading-tight">{ts.title}</h3>
                      <Link href={`/test-series/${ts._id || ts.slug}`} className="mt-auto pt-3 flex items-center text-xs font-bold text-primary group-hover:text-primary/80 transition-colors">
                        View Series <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {hotSeries.length > 10 && (
                <div className="min-w-[150px] shrink-0 snap-start flex items-center justify-center">
                  <Link href="/test-series" className="flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors group p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold">See All</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exams under the explored agency — compact chips, preferences untouched.
            Hidden entirely until preferences exist (fresh users see only the red button). */}
        {preferredAgencyId && !needsPreferences && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold font-outfit flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">
                  Exams
                  {(() => {
                    const ag = allAgencyList.find((a: any) => a._id === preferredAgencyId);
                    return ag ? <span className="text-primary"> · {ag.code || ag.name}</span> : null;
                  })()}
                </span>
              </h2>
              <span className="text-[10px] text-muted-foreground font-semibold hidden sm:block shrink-0">Exploring — set your real preferences from Profile</span>
            </div>
            {agencyExams.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-card">
                No exams listed under this agency yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {(showAllExams ? agencyExams : agencyExams.slice(0, examCollapsedLimit)).map((e: any) => (
                  <Link
                    key={e._id}
                    href={`/exams/${e._id}`}
                    title={e.description || e.name}
                      className="group p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all flex flex-col gap-2"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold font-outfit leading-snug line-clamp-2 group-hover:text-primary transition-colors">{e.name}</span>
                      {e.code && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{e.code}</span>}
                    </Link>
                  ))}
                </div>
                {agencyExams.length > examCollapsedLimit && (
                  <button
                    onClick={() => setShowAllExams(v => !v)}
                    className="self-center px-5 py-2 rounded-xl border border-border bg-card text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                  >
                    {showAllExams ? 'Show Less' : `Show More (${agencyExams.length - examCollapsedLimit})`}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllExams ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Featured Test Series */}
        {featuredSeries.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Featured Test Series
              </h2>
              <Link href="/test-series" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                See All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex overflow-x-auto pb-2 gap-4 snap-x hide-scroll">
              {featuredSeries.map((s: any) => renderFeaturedCard(s))}
            </div>
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
        <div className="flex flex-col gap-8">
          
          {/* Main Content */}
          <div className="flex flex-col gap-8">



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
          </div>
        </div>

      {/* Mobile droplet quick-access bottom bar — students only, staff/admin skip it */}
      {!['Super Admin', 'Content Manager', 'Support'].includes(user?.role) && (
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
      )}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>
    </StudentLayout>
  );
}

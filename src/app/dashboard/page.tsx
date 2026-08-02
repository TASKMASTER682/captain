'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getAuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Flame, Calendar, BookOpen, Clock, BrainCircuit, BarChart3,
  Play, ClipboardList, LogOut, Sun, Moon, Sparkles, BookMarked,
  Target, Zap, AlertCircle, RotateCcw,
  Building2, GraduationCap, Settings, Search, Loader2, CheckCircle, PlusCircle, XCircle, TrendingUp, AlertTriangle,
  Star, UserCheck, Users, CreditCard, Lock, Megaphone, IndianRupee, Ticket, Copy, CheckCircle2, Crown, X,
  FolderOpen, Trophy, Receipt, User, HelpCircle, Newspaper
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

  // All test series loaded from API
  const [allTestSeries, setAllTestSeries] = useState<any[]>([]);
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
  const [recs, setRecs] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>({ streak: 0, questionsToday: 0, timeSpentToday: 0, scoreAvg: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAgencies, setUserAgencies] = useState<any[]>([]);
  const [userExams, setUserExams] = useState<any[]>([]);

  // Checkout modal state (for paid test series)
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const activeUser = getAuthUser();
    if (!activeUser) return;
    try {
      const userAgencyIds = activeUser?.agencies || [];
      const userExamIds = activeUser?.exams || [];

      const [tsRes, enrolledRes, histRes, recRes, weakRes, dailyRes, trendRes, gamRes, subjRes, allAgenciesRes, allExamsRes, bookmarkRes, annRes] = await Promise.all([
        api.get('/test-series').catch(() => ({ data: [] })),
        api.get('/enrollments/me').catch(() => ({ data: [] })),
        api.get('/attempts/history').catch(() => ({ data: [] })),
        api.get('/practice/recommendations').catch(() => ({ data: [] })),
        api.get('/my-analytics/weak-areas').catch(() => ({ data: [] })),
        api.get('/my-analytics/daily-stats').catch(() => ({ data: null })),
        api.get('/my-analytics/trends?months=6').catch(() => ({ data: [] })),
        api.get('/my-analytics/gamification').catch(() => ({ data: null })),
        api.get('/questions/subjects').catch(() => ({ data: [] })),
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

      const allSeries = Array.isArray(tsRes.data) ? tsRes.data : [];
      setAllTestSeries(allSeries);

      const enrolledTs = Array.isArray(enrolledRes.data) ? enrolledRes.data : [];
      const enrolledTsIds: Set<string> = new Set(enrolledTs.map((e: any) => e.testSeriesId?._id || e.testSeriesId).filter(Boolean));
      const enrolledTsObjects = enrolledTs
        .map((e: any) => e.testSeriesId)
        .filter((ts: any) => ts);
      setEnrolledIds(enrolledTsIds);
      setEnrolledSeries(enrolledTsObjects);

      const historyData = Array.isArray(histRes.data) ? histRes.data : [];
      setHistory(historyData);

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

  // Elastic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Compute recommended series (matching user's exam preferences, not enrolled)
  const recommendedSeries = useMemo(() => {
    const userExamIds = user?.exams || [];
    return allTestSeries.filter((ts: any) => {
      const examId = ts.examId?._id || ts.examId;
      const matchesExam = userExamIds.length === 0 || userExamIds.includes(examId);
      const notEnrolled = !enrolledIds.has(ts._id);
      return matchesExam && notEnrolled;
    });
  }, [allTestSeries, enrolledIds, user]);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) {
      router.push('/login');
      return;
    }
    setUser(activeUser);
    loadData();
  }, [router, loadData]);

  // Elastic search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/test-series/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const openCheckout = (item: any) => {
    setCheckoutItem(item);
    setCouponCode('');
    setCouponInfo(null);
    setCouponError('');
    setOrderError('');
  };

  const closeCheckout = () => {
    setCheckoutItem(null);
    setProcessing(false);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !checkoutItem) return;
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        amount: checkoutItem.price,
      });
      setCouponInfo(res.data);
    } catch (err: any) {
      setCouponInfo(null);
      setCouponError(err.message || 'Invalid coupon');
    }
  };

  const discount = couponInfo?.discount || 0;
  const payable = Math.max(0, (checkoutItem?.price || 0) - discount);

  const handleCheckout = async () => {
    if (!checkoutItem || processing) return;
    setProcessing(true);
    setOrderError('');
    try {
      const res = await api.post('/orders/checkout', {
        type: checkoutItem.type,
        ...(checkoutItem.type === 'plan' ? { planId: checkoutItem._id } : { testSeriesId: checkoutItem._id }),
        couponCode: couponInfo?.code || undefined,
      });
      const data = res.data;

      // Offline mode (no Razorpay keys configured) — auto-verify
      if (data.mode === 'offline' || !data.razorpayOrderId) {
        const verify = await api.post('/orders/verify', {
          orderId: data.orderId,
          mode: 'offline',
        });
        await loadData();
        setProcessing(false);
        setCheckoutItem(null);
        alert('Payment recorded successfully. Access unlocked! 🎉');
        return;
      }

      // Real Razorpay flow
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        setOrderError('Payment gateway could not load. Please try again.');
        setProcessing(false);
        return;
      }

      const rzp = new Razorpay({
        key_id: data.keyId,
        amount: data.amount * 100,
        currency: data.currency,
        name: 'ExamOS',
        description: `Order #${data.orderId}`,
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await api.post('/orders/verify', {
              orderId: data.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              mode: 'razorpay',
            });
            await loadData();
            setCheckoutItem(null);
            alert('Payment successful! Access unlocked. 🎉');
          } catch (err: any) {
            setOrderError(err.message || 'Payment verification failed.');
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#6366f1' },
      });
      rzp.open();
    } catch (err: any) {
      setOrderError(err.message || 'Checkout failed.');
      setProcessing(false);
    }
  };

  // Razorpay checkout script loader
  const loadRazorpay = () => {
    return new Promise<{ new (options: any): any }>((resolve) => {
      if ((window as any).Razorpay) return resolve((window as any).Razorpay);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve((window as any).Razorpay);
      script.onerror = () => resolve(null as any);
      document.body.appendChild(script);
    });
  };

  const toggleEnroll = async (seriesId: string, currentlyEnrolled: boolean) => {
    if (enrolling.has(seriesId)) return;
    const ts = allTestSeries.find((t: any) => t._id === seriesId);
    const isPaid = ts?.price > 0;
    
    // If paid test series and not enrolled, open checkout instead of direct enroll
    if (!currentlyEnrolled && isPaid) {
      openCheckout({ ...ts, type: 'test_series' });
      return;
    }
    
    setEnrolling(prev => new Set(prev).add(seriesId));
    try {
      if (currentlyEnrolled) {
        await api.delete(`/enrollments/unenroll/${seriesId}`);
        setEnrolledIds(prev => { const n = new Set(prev); n.delete(seriesId); return n; });
        setEnrolledSeries(prev => prev.filter((t: any) => t._id !== seriesId));
      } else {
        await api.post(`/enrollments/enroll/${seriesId}`, {});
        setEnrolledIds(prev => new Set(prev).add(seriesId));
        if (ts) setEnrolledSeries(prev => [...prev, ts]);
      }
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

  const isSearching = searchQuery.trim().length > 0;

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
            <button
              onClick={(e) => { e.stopPropagation(); toggleEnroll(ts._id, isEnrolled); }}
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
                      <h4 className="font-bold text-sm font-outfit">{test.title}</h4>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
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
                <div key={a._id} className="flex items-start gap-3 p-4 rounded-2xl shadow-sm" style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}>
                  <Megaphone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: accent }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm font-outfit">{a.title}</span>
                      {a.type && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: `${accent}15`, color: accent }}>{a.type}</span>}
                    </div>
                    {a.message && <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Daily Goals Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl border border-border bg-card flex items-center gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-lg"></div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner">
              <Flame className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Current Streak</span>
              <span className="text-2xl font-bold font-outfit text-rose-500">{dailyStats.streak}-Day Streak</span>
              <span className="text-xs text-muted-foreground block mt-0.5">Keep learning daily!</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl border border-border bg-card flex items-center gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-lg"></div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Questions Today</span>
              <span className="text-2xl font-bold font-outfit text-primary">{dailyStats.questionsToday} Qs</span>
              <span className="text-xs text-muted-foreground block mt-0.5">Attempted today</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl border border-border bg-card flex items-center gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-lg"></div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Time Spent Today</span>
              <span className="text-2xl font-bold font-outfit text-emerald-500">{Math.round(dailyStats.timeSpentToday / 60)} min</span>
              <span className="text-xs text-muted-foreground block mt-0.5">Active practice time</span>
            </div>
          </div>
          <Link href="/revision" className="p-6 rounded-3xl border border-border bg-card flex items-center gap-4 relative overflow-hidden hover:border-primary transition-all group shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-lg"></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Avg Score</span>
              <span className="text-2xl font-bold font-outfit text-indigo-500 group-hover:text-primary transition-colors">{Math.round(dailyStats.scoreAvg)}%</span>
              <span className="text-xs text-primary font-bold block mt-0.5">Across all tests</span>
            </div>
          </Link>
        </div>

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

            {/* Elastic Search Bar */}
            <div className="relative">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search test series by title, exam, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                />
                {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {searchQuery && !searching && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground text-xs font-semibold">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Section */}
            {isSearching && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" /> Search Results
                  <span className="text-sm font-normal text-muted-foreground">({searchResults.length} found)</span>
                </h2>
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card">
                    No test series match "{searchQuery}"
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {searchResults.map((ts) => renderTestSeriesCard(ts, enrolledIds.has(ts._id)))}
                  </div>
                )}
              </div>
            )}

            {/* Enrolled Section */}
            {!isSearching && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-violet-500" /> Your Enrolled Test Series
                </h2>
                {enrolledSeries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card flex flex-col items-center gap-2">
                    <UserCheck className="w-8 h-8 text-muted-foreground/30" />
                    <span>You haven't enrolled in any test series yet.</span>
                    <span className="text-xs">Browse the recommended series below and enroll to get started!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {enrolledSeries.map((ts) => renderTestSeriesCard(ts, true))}
                  </div>
                )}
              </div>
            )}

            {/* Recommended Section (only show when not searching) */}
            {!isSearching && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Recommended for You
                </h2>
                {recommendedSeries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card">
                    {allTestSeries.length === 0
                      ? 'No test series available yet.'
                      : 'All available test series matching your preferences are already enrolled!'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {recommendedSeries.map((ts) => renderTestSeriesCard(ts, false))}
                  </div>
                )}
              </div>
            )}

            {/* Previous Attempts */}
            <div className="flex flex-col gap-4">
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
                        {history.map((h) => (
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
            <div className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
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
            <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm">
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-500" /> Infinite Practice Module
              </h2>
              <p className="text-xs text-muted-foreground">Select a subject to start a randomized adaptive session:</p>
              {subjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No subjects available yet. Add questions first.</p>
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

      {/* Checkout Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Checkout
              </h3>
              <button onClick={closeCheckout} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{checkoutItem.name || checkoutItem.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Test Series</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-black font-outfit">₹{checkoutItem.price}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> Coupon Code</label>
              <div className="flex gap-2">
                <input
                  type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon" className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold tracking-wider uppercase"
                />
                <button onClick={applyCoupon} className="px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95">Apply</button>
              </div>
              {couponInfo && <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {couponInfo.code} applied — you save ₹{couponInfo.discount}</p>}
              {couponError && <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{checkoutItem.price}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount</span><span>-₹{discount}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{payable}</span></div>
            </div>

            {orderError && <p className="text-xs text-rose-500 font-semibold p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">{orderError}</p>}

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Pay ₹{payable} Securely</>}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">Payments processed securely via Razorpay</p>
          </div>
        </div>
      )}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>

    </div>
  );
}

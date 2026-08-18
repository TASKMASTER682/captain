'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getAuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import {
  Search, Loader2, LogOut, Sun, Moon, Star, CreditCard, Lock, CheckCircle,
  XCircle, PlusCircle, Clock, Play, ChevronLeft, Ticket, CheckCircle2, IndianRupee, X,
} from 'lucide-react';
import QrPayment from '@/components/QrPayment';
import RazorpayCheckout from '@/components/RazorpayCheckout';

export default function TestSeriesPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [allTestSeries, setAllTestSeries] = useState<any[]>([]);
  const [enrolledSeries, setEnrolledSeries] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<Set<string>>(new Set());

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesTests, setSeriesTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [qrPayment, setQrPayment] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  // --- NEW: Difficulty preference state ---
  const [difficulty, setDifficulty] = useState<'hard' | 'mix' | 'easy'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('examos_difficulty') : null;
    return stored as 'hard' | 'mix' | 'easy' || 'mix';
  });
  useEffect(() => {
    try { localStorage.setItem('examos_difficulty', difficulty); } catch {}
  }, [difficulty]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const activeUser = getAuthUser();
    if (!activeUser) return;
    try {
      const [tsRes, enrolledRes] = await Promise.all([
        api.get('/test-series').catch(() => ({ data: [] })),
        api.get('/enrollments/me').catch(() => ({ data: [] })),
      ]);

      const allSeries = Array.isArray(tsRes.data) ? tsRes.data : [];
      setAllTestSeries(allSeries);

      const enrolledTs = Array.isArray(enrolledRes.data) ? enrolledRes.data : [];
      const enrolledTsIds: Set<string> = new Set(enrolledTs.map((e: any) => e.testSeriesId?._id || e.testSeriesId).filter(Boolean));
      const enrolledTsObjects = enrolledTs
        .map((e: any) => e.testSeriesId)
        .filter((ts: any) => ts);
      setEnrolledIds(enrolledTsIds);
      setEnrolledSeries(enrolledTsObjects);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  // Compute recommended series (matching user's exam preferences + difficulty, not enrolled)
  const recommendedSeries = useMemo(() => {
    const userExamIds = user?.exams || [];
    const userDifficulty = difficulty;
    return allTestSeries.filter((ts: any) => {
      const examId = ts.examId?._id || ts.examId;
      const matchesExam = userExamIds.length === 0 || userExamIds.includes(examId);
      const matchesDifficulty = !userDifficulty || ts.difficulty === userDifficulty;
      const notEnrolled = !enrolledIds.has(ts._id);
      return matchesExam && matchesDifficulty && notEnrolled;
    });
  }, [allTestSeries, enrolledIds, user, difficulty]);

  // Elastic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

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
        alert('Payment recorded successfully. Access unlocked!');
        return;
      }

      setProcessing(false);
      setQrPayment(data);
    } catch (err: any) {
      setOrderError(err.message || 'Checkout failed.');
      setProcessing(false);
    }
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

    // Paid series can't be unenrolled
    if (currentlyEnrolled && isPaid) return;

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
            {isEnrolled && isPaid ? (
              <span className="px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 border border-violet-500/30 text-violet-600 bg-violet-500/5">
                <CheckCircle className="w-3.5 h-3.5" /> Enrolled
              </span>
            ) : (
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading test series...</span>
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
            <img src="/logo.png" alt="ExamOS" className="w-10 h-10 rounded-xl shadow-md shadow-primary/20 object-cover" />
            <span className="font-bold text-xl tracking-tight font-outfit">Test Series</span>
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

        {/* Difficulty Filter Bar - NEW */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-card shadow-sm mb-6">
          <span className="text-sm text-muted-foreground font-medium">Difficulty Level</span>
          <button
            onClick={() => setDifficulty('easy')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              difficulty === 'easy' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-muted-foreground hover:bg-emerald-100'
            }`}
            title="Easy"
          >
            <Sun className="w-3.5 h-3.5 text-emerald-400" /> Easy
          </button>
          <button
            onClick={() => setDifficulty('mix')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              difficulty === 'mix' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-muted-foreground hover:bg-amber-100'
            }`}
            title="Mix"
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" /> Mix
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              difficulty === 'hard' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-muted-foreground hover:bg-rose-100'
            }`}
            title="Hard"
          >
            <Star className="w-3.5 h-3.5 text-rose-400" /> Hard
          </button>
        </div>

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
              aria-label="Search test series"
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
        {isSearching ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold font-outfit flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Search Results
              <span className="text-sm font-normal text-muted-foreground">({searchResults.length} found)</span>
            </h2>
            {searching ? (
              <div className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl bg-card">
                No test series match "{searchQuery}"
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {searchResults.map((ts) => renderTestSeriesCard(ts, enrolledIds.has(ts._id)))}
              </div>
            )}
          </div>
        ) : (
          /* Recommended Section */
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

      </main>

      {/* QR Payment Modal */}
      {qrPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          {qrPayment.keyId && qrPayment.razorpayOrderId ? (
            <RazorpayCheckout
              keyId={qrPayment.keyId}
              orderId={qrPayment.orderId}
              razorpayOrderId={qrPayment.razorpayOrderId}
              amount={qrPayment.amount}
              itemName={qrPayment.item.name}
              onSuccess={async () => {
                setQrPayment(null);
                setCheckoutItem(null);
                await loadData();
                alert('Payment successful! Access unlocked.');
              }}
              onCancel={() => { setQrPayment(null); setCheckoutItem(null); setProcessing(false); }}
            />
          ) : (
            <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-outfit">Scan & Pay</h3>
                <button onClick={() => { setQrPayment(null); setCheckoutItem(null); }} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <QrPayment
                orderId={qrPayment.orderId}
                razorpayOrderId={qrPayment.razorpayOrderId}
                upiString={qrPayment.upiString}
                merchantVpa={qrPayment.merchantVpa}
                amount={qrPayment.amount}
                itemName={qrPayment.item.name}
                onSuccess={async () => {
                  setQrPayment(null);
                  setCheckoutItem(null);
                  await loadData();
                  alert('Payment successful! Access unlocked.');
                }}
                onCancel={() => { setQrPayment(null); setCheckoutItem(null); setProcessing(false); }}
              />
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutItem && !qrPayment && (
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
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Pay ₹{payable}</>}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">UPI payment via Razorpay</p>
          </div>
        </div>
      )}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Powered by ExamOS CBT Engine. All algorithms run locally.
      </footer>

    </div>
  );
}
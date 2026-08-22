'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getAuthUser, clearAuth } from '@/lib/api';
import {
  Check, ArrowLeft, ShoppingCart, Ticket, Copy, CheckCircle2,
  Lock, Sparkles, RefreshCw, Loader2, Gift, IndianRupee, CreditCard, X, Crown, Target,
  Zap, Clock, Star, BookOpen,
} from 'lucide-react';
import QrPayment from '@/components/QrPayment';
import RazorpayCheckout from '@/components/RazorpayCheckout';

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [qrPayment, setQrPayment] = useState<any>(null);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) { router.push('/login'); return; }
    setUser(activeUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, seriesRes, ordersRes, refRes] = await Promise.all([
        api.get('/plans').catch(() => ({ data: [] })),
        api.get('/test-series').catch(() => ({ data: [] })),
        api.get('/orders/my-orders').catch(() => ({ data: [] })),
        api.get('/auth/referral').catch(() => ({ data: null })),
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      const allSeries = Array.isArray(seriesRes.data) ? seriesRes.data : [];
      setTestSeries(allSeries.filter((s: any) => s.price > 0));
      setMyOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setReferral(refRes?.data || null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCheckout = (item: any) => {
    setCheckoutItem(item);
    setCouponCode('');
    setCouponInfo(null);
    setCouponError('');
    setOrderError('');
  };

  const closeCheckout = () => { setCheckoutItem(null); setProcessing(false); };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !checkoutItem) return;
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, amount: checkoutItem.price });
      setCouponInfo(res.data);
    } catch (err: any) { setCouponInfo(null); setCouponError(err.message || 'Invalid coupon'); }
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
      if (data.mode === 'offline' || !data.razorpayOrderId) {
        await api.post('/orders/verify', { orderId: data.orderId, mode: 'offline' });
        await loadData(); setProcessing(false); setCheckoutItem(null);
        alert('Payment recorded successfully. Access unlocked!'); return;
      }
      setProcessing(false); setQrPayment(data);
    } catch (err: any) { setOrderError(err.message || 'Checkout failed.'); setProcessing(false); }
  };

  const copyReferral = () => {
    if (!referral?.link) return;
    navigator.clipboard.writeText(referral.link); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const cycleLabel: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', lifetime: 'Lifetime' };
  const orderBadge = (s: string) => ({ paid: 'bg-emerald-500/10 text-emerald-500', pending: 'bg-amber-500/10 text-amber-500', failed: 'bg-rose-500/10 text-rose-500', refunded: 'bg-slate-500/10 text-slate-400' }[s] || 'bg-secondary text-muted-foreground');

  const hasActivePlan = user?.subscription?.status === 'active';
  const currentPlan = plans.find((p: any) => p._id === user?.subscription?.planId);

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary-foreground hover:text-secondary transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg font-outfit leading-tight">Plans &amp; Pricing</h1>
            <p className="text-[11px] text-muted-foreground">Choose the right plan for your preparation</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl bg-secondary hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading plans...</div>
        ) : (
          <>
            {hasActivePlan && (
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-600">{currentPlan?.name || 'Premium Active'}</p>
                    {user.subscription.expiresAt && <p className="text-xs text-muted-foreground">Valid till {new Date(user.subscription.expiresAt).toLocaleDateString()}</p>}
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold shrink-0">ACTIVE</span>
                </div>
              </div>
            )}

            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Crown className="w-5 h-5" /></div>
                <div><h2 className="text-lg font-bold font-outfit">Subscription Packs</h2><p className="text-[11px] text-muted-foreground">Unlock all test series under your exams</p></div>
              </div>
              {plans.length === 0 ? (
                <div className="p-8 rounded-2xl border border-border bg-card text-center"><Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No packs available yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {plans.map((p: any) => {
                    const isCurrent = user?.subscription?.planId === p._id && hasActivePlan;
                    const cov = p.coverage || {};
                    const covLabel: Record<string, string> = { all: 'All test series', manual: `${(cov.seriesIds || []).length} select series`, fraction: `${Math.round((cov.fraction || 1) * 100)}% series`, random: `Random ${Math.round((cov.fraction || 1) * 100)}%` };
                    const months = p.durationMonths > 0 ? p.durationMonths : (p.durationDays > 0 ? Math.round(p.durationDays / 30) : 0);
                    return (
                      <div key={p._id} className={`relative p-6 rounded-3xl border bg-card flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 ${p.popular ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/10' : 'border-border hover:border-primary/30'}`}>
                        {p.popular && <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-md shadow-amber-500/30 flex items-center gap-1"><Star className="w-3 h-3" /> MOST POPULAR</div>}
                        <div><h3 className="font-bold font-outfit text-base">{p.name}</h3>{p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}</div>
                        <div className="flex items-baseline gap-1"><span className="text-3xl font-black font-outfit">₹{p.price}</span><span className="text-xs text-muted-foreground">/ {cycleLabel[p.billingCycle] || p.billingCycle}</span></div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 text-[10px] font-bold"><Clock className="w-3 h-3" /> {months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'Lifetime'}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 text-[10px] font-bold"><Target className="w-3 h-3" /> {covLabel[cov.type] || 'All test series'}</span>
                        </div>
                        {p.examIds?.length > 0 && <div className="flex flex-wrap gap-1">{p.examIds.map((e: any, i: number) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">{e.name || e}</span>)}</div>}
                        {(p.features || []).length > 0 && <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">{p.features.map((f: string, i: number) => <span key={i} className="text-xs flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="text-muted-foreground">{f}</span></span>)}</div>}
                        <button onClick={() => isCurrent ? null : openCheckout({ ...p, type: 'plan' })} disabled={isCurrent} className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-auto ${isCurrent ? 'bg-emerald-500/10 text-emerald-500 cursor-default' : p.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 shadow-md shadow-amber-500/25' : 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/25'}`}>
                          {isCurrent ? <><CheckCircle2 className="w-3.5 h-3.5" /> Current Pack</> : <><Zap className="w-3.5 h-3.5" /> Subscribe Now</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><ShoppingCart className="w-5 h-5" /></div>
                <div><h2 className="text-lg font-bold font-outfit">Premium Test Series</h2><p className="text-[11px] text-muted-foreground">Buy individual test series with full access</p></div>
              </div>
              {testSeries.length === 0 ? (
                <div className="p-8 rounded-2xl border border-border bg-card text-center"><ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No paid test series available yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {testSeries.map((s: any) => {
                    const owned = myOrders.some((o: any) => o.type === 'test_series' && o.testSeries?._id === s._id && o.status === 'paid');
                    return (
                      <div key={s._id} className="rounded-3xl border border-border bg-card overflow-hidden flex flex-col hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
                        {s.banner ? <img src={s.banner} alt={s.title} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center"><BookOpen className="w-8 h-8 text-emerald-500/30" /></div>}
                        <div className="p-5 flex flex-col gap-2 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold font-outfit text-sm leading-tight">{s.title}</h3>
                            {owned && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold shrink-0 flex items-center gap-1"><Check className="w-3 h-3" /> Owned</span>}
                          </div>
                          {s.examId?.name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 w-fit font-semibold">{s.examId.name}</span>}
                          {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <span className="text-xl font-black font-outfit text-emerald-600">₹{s.price}</span>
                            <button onClick={() => owned ? null : openCheckout({ ...s, type: 'test_series' })} disabled={owned} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${owned ? 'bg-emerald-500/10 text-emerald-500 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'}`}>
                              {owned ? <><CheckCircle2 className="w-3.5 h-3.5" /> Purchased</> : <><Lock className="w-3.5 h-3.5" /> Buy Now</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {referral?.code && (
              <section className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                <div className="pointer-events-none absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0"><Gift className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-sm font-outfit flex items-center gap-2">Invite Friends, Earn Rewards <Sparkles className="w-3.5 h-3.5 text-violet-500" /></h3>
                      <p className="text-xs text-muted-foreground mt-0.5">You have referred <strong>{referral.referralCount}</strong> friend{referral.referralCount !== 1 ? 's' : ''} and earned <strong className="text-emerald-500">₹{referral.rewardAmount}</strong>.</p>
                      <button onClick={copyReferral} className="mt-2.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy Referral Link'}
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 border border-violet-500/20 font-mono text-sm font-bold tracking-wider">{referral.code}</div>
                </div>
              </section>
            )}

            {myOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><CreditCard className="w-5 h-5" /></div>
                  <div><h2 className="text-lg font-bold font-outfit">Order History</h2><p className="text-[11px] text-muted-foreground">{myOrders.length} order{myOrders.length !== 1 ? 's' : ''}</p></div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {myOrders.map((o: any) => (
                    <div key={o._id} className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>{o.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-sm truncate">{o.plan?.name || o.testSeries?.title || o.type}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${orderBadge(o.status)}`}>{o.status}</span></div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{o.couponCode ? ` · Coupon ${o.couponCode} (-₹${o.discount})` : ''}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0"><div className="text-lg font-black font-outfit">₹{o.amount}</div>{o.subtotal > o.amount && <div className="text-[10px] text-muted-foreground line-through">₹{o.subtotal}</div>}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {qrPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          {qrPayment.keyId && qrPayment.razorpayOrderId ? (
            <RazorpayCheckout keyId={qrPayment.keyId} orderId={qrPayment.orderId} razorpayOrderId={qrPayment.razorpayOrderId} amount={qrPayment.amount} itemName={qrPayment.item.name} onSuccess={async () => { setQrPayment(null); setCheckoutItem(null); await loadData(); alert('Payment successful! Access unlocked.'); }} onCancel={() => { setQrPayment(null); setCheckoutItem(null); setProcessing(false); }} />
          ) : (
            <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center"><h3 className="text-xl font-bold font-outfit">Scan &amp; Pay</h3><button onClick={() => { setQrPayment(null); setCheckoutItem(null); }} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button></div>
              <QrPayment orderId={qrPayment.orderId} razorpayOrderId={qrPayment.razorpayOrderId} upiString={qrPayment.upiString} merchantVpa={qrPayment.merchantVpa} amount={qrPayment.amount} itemName={qrPayment.item.name} onSuccess={async () => { setQrPayment(null); setCheckoutItem(null); await loadData(); alert('Payment successful! Access unlocked.'); }} onCancel={() => { setQrPayment(null); setCheckoutItem(null); setProcessing(false); }} />
            </div>
          )}
        </div>
      )}

      {checkoutItem && !qrPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-card w-full max-w-md p-5 sm:p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold font-outfit flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Checkout</h3><button onClick={closeCheckout} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button></div>
            <div className="p-4 rounded-2xl border border-border bg-muted/20">
              <div className="flex items-center justify-between"><span className="text-sm font-bold">{checkoutItem.name || checkoutItem.title}</span>{checkoutItem.type === 'plan' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">{cycleLabel[checkoutItem.billingCycle]}</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">Test Series</span>}</div>
              <div className="flex items-center gap-2 mt-2"><IndianRupee className="w-4 h-4 text-muted-foreground" /><span className="text-2xl font-black font-outfit">₹{checkoutItem.price}</span></div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> Coupon Code</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon" className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold tracking-wider uppercase" />
                <button onClick={applyCoupon} className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shrink-0">Apply</button>
              </div>
              {couponInfo && <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {couponInfo.code} applied - you save ₹{couponInfo.discount}</p>}
              {couponError && <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>}
            </div>
            <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{checkoutItem.price}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount</span><span>-₹{discount}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{payable}</span></div>
            </div>
            {orderError && <p className="text-xs text-rose-500 font-semibold p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">{orderError}</p>}
            <button onClick={handleCheckout} disabled={processing} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-primary/25">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Pay ₹{payable}</>}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">Secure payment via Razorpay</p>
          </div>
        </div>
      )}
    </div>
  );
}
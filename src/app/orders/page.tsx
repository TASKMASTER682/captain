'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getAuthUser, clearAuth } from '@/lib/api';
import {
  ArrowLeft, CreditCard, Ticket, RefreshCw, Loader2, CheckCircle2,
  XCircle, Clock, AlertCircle, RotateCcw, FileText, Copy
} from 'lucide-react';

const statusLabel: any = {
  paid: { label: 'Paid', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  refunded: { label: 'Refunded', icon: RotateCcw, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
};

const typeLabel: any = {
  plan: { label: 'Plan', icon: CreditCard, color: 'text-primary' },
  test_series: { label: 'Test Series', icon: FileText, color: 'text-emerald-500' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) { router.push('/login'); return; }
    setUser(activeUser);
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'highest') return b.amount - a.amount;
      return a.amount - b.amount;
    });

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <CreditCard className="w-5 h-5 text-indigo-500" />
          <h1 className="font-bold text-lg font-outfit">My Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadOrders} className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl border border-border bg-card text-rose-500 hover:bg-rose-500/10 text-xs font-bold">Logout</button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold font-outfit mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Your subscription and test series purchases will appear here.</p>
            <Link href="/plans" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/95">
              <CreditCard className="w-4 h-4" /> Browse Plans
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap gap-2">
                {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${filter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-4 py-2 rounded-xl border border-border bg-background text-sm font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>

            {/* Orders List */}
            <div className="flex flex-col gap-4">
              {filteredOrders.map((o: any) => {
                const st = statusLabel[o.status] || { label: o.status, icon: AlertCircle, color: 'text-muted-foreground' };
                const ty = typeLabel[o.type] || { label: o.type, icon: FileText, color: 'text-muted-foreground' };
                const StatusIcon = st.icon;
                const TypeIcon = ty.icon;
                return (
                  <div key={o._id} className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{o.plan?.name || o.testSeries?.title || o.type}</span>
                          <StatusIcon className={`w-3.5 h-3.5 ${st.color.split(' ')[0]}`} />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.color}`}>{st.label}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ty.color} bg-opacity-10`}>{ty.label}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-4">
                          <span>{new Date(o.createdAt).toLocaleString()}</span>
                          {o.couponCode && <span>Coupon: {o.couponCode} (-₹{o.discount})</span>}
                          {o.razorpayOrderId && <span>Razorpay: {o.razorpayOrderId.slice(-12)}</span>}
                          {o.paymentId && <span>Payment: {o.paymentId.slice(-12)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:w-32 shrink-0">
                      <div className="text-lg font-black font-outfit">₹{o.amount}</div>
                      {o.subtotal > o.amount && <div className="text-[10px] text-muted-foreground line-through">₹{o.subtotal}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
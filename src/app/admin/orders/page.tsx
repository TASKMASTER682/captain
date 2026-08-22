'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, ShoppingCart, RefreshCw, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders${status ? `?status=${status}` : ''}`);
      setOrders(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const refund = async (id: string) => {
    if (!confirm('Refund this paid order?')) return;
    try { await api.post(`/orders/${id}/refund`, {}); await load(); }
    catch (err: any) { alert(err.message); }
  };

  const badge = (s: string) => ({
    paid: 'bg-emerald-500/10 text-emerald-500',
    pending: 'bg-amber-500/10 text-amber-500',
    failed: 'bg-rose-500/10 text-rose-500',
    refunded: 'bg-slate-500/10 text-slate-400',
  }[s] || 'bg-secondary text-muted-foreground');

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No orders found.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(o => (
              <div key={o._id} className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{o.plan?.name || o.testSeries?.title || o.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge(o.status)}`}>{o.status}</span>
                    {o.type === 'plan' && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">Plan</span>}
                    {o.type === 'test_series' && <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 font-bold">Test Series</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{o.user?.name} · {o.user?.email}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleString()}{o.couponCode ? ` · Coupon ${o.couponCode} (-₹${o.discount})` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-black font-outfit">₹{o.amount}</div>
                    {o.subtotal > o.amount && <div className="text-[10px] text-muted-foreground line-through">₹{o.subtotal}</div>}
                  </div>
                  {o.status === 'paid' && (
                    <button onClick={() => refund(o._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Refund"><Undo2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
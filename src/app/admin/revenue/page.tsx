'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, IndianRupee, TrendingUp, ShoppingCart, Receipt, Percent } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function RevenueDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/revenue');
      setData(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const maxTrend = Math.max(...(data?.trend || []).map((t: any) => t.revenue), 1);

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {loading || !data ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><IndianRupee className="w-4 h-4 text-emerald-500" /> Total Revenue</div>
                <div className="text-2xl font-black font-outfit mt-2">₹{data.totalRevenue?.toLocaleString()}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><TrendingUp className="w-4 h-4 text-indigo-500" /> This Month (MRR)</div>
                <div className="text-2xl font-black font-outfit mt-2">₹{data.mrr?.toLocaleString()}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><ShoppingCart className="w-4 h-4 text-cyan-500" /> Paid Orders</div>
                <div className="text-2xl font-black font-outfit mt-2">{data.totalOrders}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><Receipt className="w-4 h-4 text-amber-500" /> Avg Order Value</div>
                <div className="text-2xl font-black font-outfit mt-2">₹{data.avgOrderValue}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Revenue Trend (last 6 months)</h3>
                <div className="flex items-end gap-2 h-44">
                  {(data.trend || []).map((t: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-600">{t.revenue > 0 ? `₹${t.revenue}` : ''}</span>
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600/70 to-emerald-500/40 transition-all" style={{ height: `${Math.max((t.revenue / maxTrend) * 140, 4)}px` }} />
                      <span className="text-[10px] text-muted-foreground">{t.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Top Test Series by Revenue</h3>
                {data.topSeries?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No paid test series orders yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.topSeries.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-xs font-semibold">{i + 1}. {s.name}</span>
                        <span className="text-xs font-bold text-emerald-600">₹{s.revenue?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="text-sm font-bold font-outfit mb-4">Conversion Funnel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-2xl font-black font-outfit">{data.funnel.totalUsers}</div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-1">Registered Users</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-2xl font-black font-outfit">{data.funnel.usersWithOrder}</div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-1">Placed an Order</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-2xl font-black font-outfit">{data.funnel.paidUsers}</div>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-1">Paid Users</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
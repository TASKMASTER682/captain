'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Users, Activity, CalendarCheck, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EngagementDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/engagement');
      setData(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const maxSignup = Math.max(...(data?.signupTrend || []).map((t: any) => t.signups), 1);
  const maxAttempt = Math.max(...(data?.attemptTrend || []).map((t: any) => t.attempts), 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Activity className="w-5 h-5 text-violet-500" />
          <h1 className="font-bold text-lg font-outfit">Engagement Analytics</h1>
        </div>
        <button onClick={load} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">Refresh</button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {loading || !data ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><Users className="w-4 h-4 text-primary" /> Total Users</div>
                <div className="text-2xl font-black font-outfit mt-2">{data.totalUsers}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><CalendarCheck className="w-4 h-4 text-emerald-500" /> DAU (today)</div>
                <div className="text-2xl font-black font-outfit mt-2">{data.dau}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><Activity className="w-4 h-4 text-indigo-500" /> MAU</div>
                <div className="text-2xl font-black font-outfit mt-2">{data.mau}</div>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"><MousePointerClick className="w-4 h-4 text-amber-500" /> Active Ratio</div>
                <div className="text-2xl font-black font-outfit mt-2">{data.activeRatio}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Signups (last 14 days)</h3>
                <div className="flex items-end gap-1.5 h-32">
                  {(data.signupTrend || []).map((t: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-primary">{t.signups > 0 ? t.signups : ''}</span>
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-primary/70 to-primary/30 transition-all" style={{ height: `${Math.max((t.signups / maxSignup) * 100, 3)}px` }} />
                      <span className="text-[9px] text-muted-foreground">{t.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Tests Attempted (last 14 days)</h3>
                <div className="flex items-end gap-1.5 h-32">
                  {(data.attemptTrend || []).map((t: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-violet-500">{t.attempts > 0 ? t.attempts : ''}</span>
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/70 to-violet-400/30 transition-all" style={{ height: `${Math.max((t.attempts / maxAttempt) * 100, 3)}px` }} />
                      <span className="text-[9px] text-muted-foreground">{t.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Signup Sources</h3>
                <div className="flex flex-col gap-2">
                  {(data.signupSources || []).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                      <span className="text-xs font-semibold capitalize">{s.source}</span>
                      <span className="text-xs font-bold text-primary">{s.count} users</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-sm font-bold font-outfit mb-4">Top Referrers</h3>
                {data.topReferrals?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No referrals yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(data.topReferrals || []).map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                        <div>
                          <div className="text-xs font-semibold">{r.name}</div>
                          <div className="text-[10px] text-muted-foreground">{r.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-500">₹{r.rewardAmount}</div>
                          <div className="text-[10px] text-muted-foreground">{r.referralCount} referrals</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

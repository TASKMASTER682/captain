'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, BarChart3, RefreshCw, Radio, Eye, Users, MonitorSmartphone } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [live, setLive] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVisits = useCallback(async () => {
    const withTimeout = (p: Promise<any>, ms: number) =>
      Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out.')), ms))]);
    try {
      const res = await withTimeout(api.get('/analytics/visits'), 12_000);
      setData(res.data?.data || null);
      setError('');
    } catch (err) { console.error(err); setError('Failed to load analytics. Check that the backend is updated, then retry.'); }
    setLoading(false);
  }, []);

  const loadLive = useCallback(async () => {
    try {
      const res = await api.get('/analytics/live');
      setLive(res.data?.sessions || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    loadVisits();
    loadLive();
    const iv = setInterval(loadLive, 15_000);
    return () => clearInterval(iv);
  }, [router, loadVisits, loadLive]);

  const renderBreakdown = (title: string, rows: any[], color: string, maxCount: number) => (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-bold font-outfit text-muted-foreground mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-2">
              <span className="text-[11px] font-medium w-24 truncate text-muted-foreground">{r.name}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, (r.count / maxCount) * 100)}%` }} />
              </div>
              <span className="text-[11px] font-bold w-8 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {error ? (
          <div className="text-center py-12 border rounded-3xl bg-card">
            <p className="text-sm text-rose-500 font-medium mb-2">{error}</p>
            <button onClick={() => { setLoading(true); setError(''); loadVisits(); }} className="px-4 py-2 rounded-xl border border-border bg-secondary text-xs font-bold">Retry</button>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !data ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No analytics data yet.</p></div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-card">
                <div className="flex items-center gap-2 text-emerald-500 mb-1"><Radio className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Live Users</span></div>
                <p className="text-3xl font-bold font-outfit">{live.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Online in last 2 min</p>
              </div>
              <div className="p-4 rounded-2xl border border-cyan-500/20 bg-card">
                <div className="flex items-center gap-2 text-cyan-500 mb-1"><Eye className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Today Views</span></div>
                <p className="text-3xl font-bold font-outfit">{data.today?.pageviews ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Pageviews today</p>
              </div>
              <div className="p-4 rounded-2xl border border-violet-500/20 bg-card">
                <div className="flex items-center gap-2 text-violet-500 mb-1"><Users className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Today Visitors</span></div>
                <p className="text-3xl font-bold font-outfit">{data.today?.uniqueSessions ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Unique sessions</p>
              </div>
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-card">
                <div className="flex items-center gap-2 text-amber-500 mb-1"><MonitorSmartphone className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Yesterday</span></div>
                <p className="text-3xl font-bold font-outfit">{data.yesterday?.pageviews ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Pageviews</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold font-outfit text-muted-foreground mb-4">Last 14 days</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="pageviews" name="Pageviews" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="uniqueSessions" name="Visitors" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold font-outfit text-muted-foreground">Live right now</h3>
                <span className="text-[10px] text-muted-foreground">Refreshes every 15s</span>
              </div>
              {live.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">No active sessions.</p>
              ) : (
                <div className="divide-y divide-border">
                  {live.map((s) => (
                    <div key={s.sessionId} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium truncate">{s.path || '/'}</span>
                      <span className="text-muted-foreground shrink-0">{s.userId ? 'Logged in' : 'Guest'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderBreakdown('Top pages (7d)', data.topPages || [], 'bg-cyan-500', Math.max(1, ...(data.topPages || []).map((r: any) => r.count)))}
              {renderBreakdown('Top referrers (7d)', data.topReferrers || [], 'bg-violet-500', Math.max(1, ...(data.topReferrers || []).map((r: any) => r.count)))}
              {renderBreakdown('Browsers (7d)', data.browsers || [], 'bg-emerald-500', Math.max(1, ...(data.browsers || []).map((r: any) => r.count)))}
              {renderBreakdown('Devices (7d)', data.devices || [], 'bg-amber-500', Math.max(1, ...(data.devices || []).map((r: any) => r.count)))}
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
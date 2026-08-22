'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getAuthUser } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
  Database, Users, LayoutGrid, AlertCircle, IndianRupee,
  Building2, GraduationCap, Layers, FileText, UserCog,
  ShoppingCart, Ticket, Star, Megaphone, Activity,
  ClipboardList, ScrollText, Newspaper, Bug, BarChart3,
  RefreshCw, HelpCircle, CreditCard, Shield,
  TrendingUp, Users as UsersIcon, ShoppingCart as OrdersIcon, DollarSign
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeCandidates: 0,
    stagedCount: 0,
    testsCount: 0,
    totalRevenue: 0,
  });
  const [revenueData, setRevenueData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const activeUser = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!activeUser || !staffRoles.includes(activeUser.role)) {
      router.push('/login');
      return;
    }
    setUser(activeUser);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    setChartLoading(true);
    try {
      const [allQRes, stagedRes, testsRes, usersRes, revRes, analyticsRes] = await Promise.all([
        api.get('/questions?limit=1').catch(() => ({ data: [], pagination: { total: 0 } })),
        api.get('/questions/staged/all').catch(() => ({ data: [] })),
        api.get('/tests').catch(() => ({ data: [] })),
        api.get('/admin/users/stats').catch(() => ({ data: null })),
        api.get('/analytics/revenue').catch(() => ({ data: null })),
        api.get('/analytics/live').catch(() => ({ data: null })),
      ]);

      setStats({
        totalQuestions: allQRes.pagination?.total || 0,
        activeCandidates: usersRes.data?.candidates ?? 0,
        stagedCount: Array.isArray(stagedRes.data) ? stagedRes.data.length : 0,
        testsCount: Array.isArray(testsRes.data) ? testsRes.data.length : 0,
        totalRevenue: revRes?.data?.totalRevenue || 0,
      });
      setRevenueData(revRes?.data || null);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Questions', value: stats.totalQuestions, icon: Database, color: 'text-primary', bg: 'bg-primary/10', href: '/admin/parser' },
    { label: 'Pending Review', value: stats.stagedCount, icon: AlertCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10', href: '/admin/parser' },
    { label: 'Published Tests', value: stats.testsCount, icon: LayoutGrid, color: 'text-emerald-500', bg: 'bg-emerald-500/10', href: '/admin/test-series' },
    { label: 'Active Candidates', value: stats.activeCandidates, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', href: '/admin/users' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10', href: '/admin/revenue' },
  ];

  const quickActions = [
    { label: 'Agencies', href: '/admin/agencies', icon: Building2, color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Exams', href: '/admin/exams', icon: GraduationCap, color: 'text-violet-500 bg-violet-500/10' },
    { label: 'Test Series', href: '/admin/test-series', icon: Layers, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Questions', href: '/admin/parser', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Users', href: '/admin/users', icon: UserCog, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, color: 'text-cyan-500 bg-cyan-500/10' },
  ];

  const revenueTrend = revenueData?.trend || [];
  const topSeries = revenueData?.topSeries || [];
  const funnel = revenueData?.funnel || {};
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <AdminLayout user={user}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black font-outfit">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your platform at a glance</p>
        </div>
        <button onClick={loadStats} disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}
            className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3 hover:border-primary/30 hover:-translate-y-0.5 transition-all group">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">{s.label}</span>
              <span className="text-lg sm:text-xl font-bold font-outfit">{s.value}</span>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-bold font-outfit mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}
              className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col items-center gap-2 hover:border-primary/30 hover:-translate-y-0.5 transition-all group text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} group-hover:scale-105 transition-transform`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Business Graphs Section */}
      <div className="flex flex-col gap-6">
        <h2 className="text-sm font-bold font-outfit mb-1">Business Insights</h2>

        {/* Top row: Revenue trend + User funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 p-5 rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-outfit flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Revenue Trend (6 months)
              </h3>
              <span className="text-[10px] text-muted-foreground">Monthly revenue & orders</span>
            </div>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading charts...</div>
            ) : revenueTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No revenue data yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* User Funnel + Stats */}
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-4">
            <h3 className="text-base font-bold font-outfit flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-primary" /> User Funnel
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Users</span>
                <span className="text-sm font-bold font-outfit">{funnel.totalUsers || 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${funnel.totalUsers ? Math.min(100, (funnel.usersWithOrder / funnel.totalUsers) * 100) : 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Users with Orders</span>
                <span className="text-sm font-bold font-outfit text-amber-600">{funnel.usersWithOrder || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Paid Orders</span>
                <span className="text-sm font-bold font-outfit text-emerald-600">{funnel.paidUsers || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-xl bg-secondary/50 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Avg Order</div>
                <div className="text-sm font-bold font-outfit">₹{revenueData?.avgOrderValue || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Last 30d</div>
                <div className="text-sm font-bold font-outfit">₹{revenueData?.revenueLast30Days || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Top series + Orders chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Test Series by Revenue */}
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
            <h3 className="text-base font-bold font-outfit flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Top Series by Revenue
            </h3>
            {topSeries.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No revenue data yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {topSeries.map((s: any, idx: number) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">#{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{s.name}</div>
                      <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${topSeries[0]?.revenue ? (s.revenue / topSeries[0].revenue) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-sm font-bold font-outfit text-emerald-600 shrink-0">₹{s.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Orders Bar Chart */}
          <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
            <h3 className="text-base font-bold font-outfit flex items-center gap-2 mb-4">
              <OrdersIcon className="w-4 h-4 text-primary" /> Monthly Orders
            </h3>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
            ) : revenueTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="orders" name="Orders" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
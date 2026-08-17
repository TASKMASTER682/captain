'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getAuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import QuestionRenderer from '@/components/QuestionRenderer';
import { 
  Database, FileText, LayoutGrid, Users, PlusCircle, 
  Trash2, Edit, Search, LogOut, Sun, Moon, CheckCircle2, 
  AlertCircle, History, Filter, Building2, GraduationCap, 
  Layers, UserCog, ChevronDown, ChevronUp, RefreshCw,
  HelpCircle, IndianRupee, ShoppingCart, Ticket,
  Megaphone, Activity, ClipboardList, ScrollText, Newspaper, Star, Bug, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stagedCount, setStagedCount] = useState(0);
  const [testsCount, setTestsCount] = useState(0);

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repoOpen, setRepoOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeCandidates: 0,
  });
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    const activeUser = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!activeUser || !staffRoles.includes(activeUser.role)) {
      router.push('/login');
      return;
    }
    setUser(activeUser);
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allQRes, qRes, stagedRes, testsRes, usersRes, subjRes, revRes] = await Promise.all([
        api.get('/questions?limit=1'),
        api.get(`/questions?subject=${subject}&difficulty=${difficulty}&search=${search}`),
        api.get('/questions/staged/all').catch(() => ({ data: [] })),
        api.get('/tests').catch(() => ({ data: [] })),
        api.get('/users?role=User').catch(() => ({ data: [] })),
        api.get('/questions/subjects'),
        api.get('/analytics/revenue').catch(() => ({ data: null })),
      ]);

      setQuestions(Array.isArray(qRes.data) ? qRes.data : []);
      setStagedCount(Array.isArray(stagedRes.data) ? stagedRes.data.length : 0);
      setTestsCount(Array.isArray(testsRes.data) ? testsRes.data.length : 0);
      setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      setRevenueData(revRes?.data || null);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const candidates = users.filter((u: any) => u.active !== false).length;

      setStats({
        totalQuestions: allQRes.pagination?.total || (Array.isArray(allQRes.data) ? allQRes.data.length : 0) || 0,
        activeCandidates: candidates,
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin stats', err);
      setLoading(false);
    }
  };

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboardData();
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Retire this question from the active bank?')) return;
    try {
      await api.delete(`/questions/${qId}`);
      setQuestions(prev => prev.filter(q => q._id !== qId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !confirm(`Retire ${ids.length} question(s) from the active bank?`)) return;
    try {
      await api.post('/questions/bulk-delete', { ids, hardDelete: true });
      setQuestions(prev => prev.filter(q => !selectedIds.has(q._id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = questions.length > 0 && questions.every(q => selectedIds.has(q._id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q._id)));
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ExamOS" className="w-10 h-10 rounded-xl shadow-md shadow-primary/20 object-cover" />
          <span className="font-bold text-xl tracking-tight font-outfit">ExamOS Management</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-primary font-bold">{user.role} Panel</div>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl border border-border bg-card text-rose-500 hover:bg-rose-500/10 transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-black font-outfit">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage agencies, exams, test series, questions, and users.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/agencies" className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-600/15">
              <Building2 className="w-4 h-4" /> Agencies
            </Link>
            <Link href="/admin/exams" className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/15">
              <GraduationCap className="w-4 h-4" /> Exams
            </Link>
            <Link href="/admin/test-series" className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/15">
              <Layers className="w-4 h-4" /> Test Series
            </Link>
            <Link href="/admin/parser" className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/15">
              <FileText className="w-4 h-4" /> Question Manager
            </Link>
            <Link href="/admin/users" className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/15">
              <UserCog className="w-4 h-4" /> Users
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Question Bank</span>
              <span className="text-xl font-bold font-outfit">{stats.totalQuestions}</span>
            </div>
          </div>
          <Link href="/admin/parser" className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Pending Review</span>
              <span className="text-xl font-bold font-outfit text-indigo-500">{stagedCount}</span>
            </div>
          </Link>
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Published Tests</span>
              <span className="text-xl font-bold font-outfit text-emerald-500">{testsCount}</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Active Candidates</span>
              <span className="text-xl font-bold font-outfit text-amber-500">{stats.activeCandidates}</span>
            </div>
          </div>
          <Link href="/admin/revenue" className="p-5 rounded-2xl border border-emerald-500/20 bg-card shadow-sm flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Total Revenue</span>
              <span className="text-xl font-bold font-outfit text-emerald-500">₹{(revenueData?.totalRevenue || 0).toLocaleString()}</span>
            </div>
          </Link>
        </div>

        <div>
          <h2 className="text-base font-bold font-outfit mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-emerald-500" /> Business Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/admin/revenue', icon: IndianRupee, label: 'Revenue Dashboard', color: 'text-emerald-500 bg-emerald-500/10' },
              { href: '/admin/engagement', icon: Activity, label: 'Engagement', color: 'text-violet-500 bg-violet-500/10' },
              { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', color: 'text-cyan-500 bg-cyan-500/10' },
              { href: '/admin/coupons', icon: Ticket, label: 'Coupons', color: 'text-pink-500 bg-pink-500/10' },
              { href: '/admin/plans', icon: Star, label: 'Plans / Subscriptions', color: 'text-amber-500 bg-amber-500/10' },
              { href: '/admin/announcements', icon: Megaphone, label: 'Announcements', color: 'text-sky-500 bg-sky-500/10' },
              { href: '/admin/attempts', icon: ClipboardList, label: 'Student Attempts', color: 'text-violet-500 bg-violet-500/10' },
              { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs', color: 'text-indigo-500 bg-indigo-500/10' },
              { href: '/admin/materials', icon: FileText, label: 'Study Materials', color: 'text-emerald-500 bg-emerald-500/10' },
              { href: '/admin/doubts', icon: HelpCircle, label: 'Doubts Forum', color: 'text-amber-500 bg-amber-500/10' },
              { href: '/admin/blogs', icon: Newspaper, label: 'Blogs', color: 'text-sky-500 bg-sky-500/10' },
              { href: '/admin/error-logs', icon: Bug, label: 'Error Logs', color: 'text-rose-500 bg-rose-500/10' },
              { href: '/admin/analytics', icon: BarChart3, label: 'Analytics / Traffic', color: 'text-cyan-500 bg-cyan-500/10' },
            ].map(m => (
              <Link key={m.href} href={m.href} className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3 hover:border-primary/30 transition-all group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.color} group-hover:scale-105 transition-transform`}><m.icon className="w-4 h-4" /></div>
                <span className="text-xs font-semibold leading-tight">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap cursor-pointer select-none"
                onClick={() => setRepoOpen(!repoOpen)}>
                <h2 className="text-base font-bold font-outfit flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" /> Question Repository
                  <span className="text-[11px] font-normal text-muted-foreground">({questions.length} shown)</span>
                  {repoOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </h2>
                {repoOpen && (
                <form onSubmit={handleSearchTrigger} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search by body or tags..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none cursor-pointer">
                    <option value="">All Subj</option>
                    {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
                )}
              </div>

              {repoOpen && (() => {
                if (questions.length === 0) {
                  return <div className="p-12 text-center text-sm text-muted-foreground">No matching items in master bank.</div>;
                }
                return (
                  <>
                    {selectedIds.size > 0 && (
                      <div className="sticky top-0 z-10 px-5 py-3 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-500">{selectedIds.size} selected</span>
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors">Clear</button>
                          <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="divide-y divide-border">
                      <div className="px-5 py-2.5 flex items-center gap-4 bg-muted/30">
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-border accent-rose-500 cursor-pointer shrink-0" />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select All</span>
                      </div>
                      {questions.map((q, idx) => (
                      <div key={q._id}>
                        <div className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}>
                          <input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelect(q._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border accent-rose-500 cursor-pointer shrink-0" />
                          <span className="shrink-0 w-7 h-7 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-bold">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{q.body?.split('\n')[0] || '(no body)'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {q.subject && <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">{q.subject}</span>}
                              {q.topic && <span className="text-[10px] text-muted-foreground">{q.topic}</span>}
                              {q.type && <span className="text-[10px] text-muted-foreground">| {q.type}</span>}
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                            <span className={`px-2 py-0.5 rounded font-semibold ${
                              q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                              q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>{q.difficulty || 'N/A'}</span>
                            <span>+{q.marks ?? 1}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q._id); }}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {expandedId === q._id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                        {expandedId === q._id && (
                          <div className="px-5 pb-5 pt-2 border-t border-border/40 bg-muted/10">
                            <QuestionRenderer question={q} showOptions showExplanation showCorrectAnswer showMeta showHeader={false} />
                          </div>
                        )}
                      </div>
                    )                    )}
                  </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold font-outfit flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" /> Activity Log
              </h3>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/10 flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p>Audit telemetry appears here once the backend activity logger is configured.</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-gradient-to-br from-card to-primary/5 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold font-outfit">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link href="/admin/test-series" className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors">
                  Test Series <span className="text-primary">&rarr;</span>
                </Link>
                <Link href="/admin/test-builder" className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors">
                  Test Builder <span className="text-primary">&rarr;</span>
                </Link>
                <Link href="/admin/parser" className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors">
                  Question Manager <span className="text-primary">&rarr;</span>
                </Link>
              </div>
              <button onClick={loadDashboardData} disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
        Platform Version: {process.env.NEXT_PUBLIC_APP_VERSION || 'dev'} | Admin Console
      </footer>
    </div>
  );
}

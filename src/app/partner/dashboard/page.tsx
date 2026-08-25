'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, DollarSign, BookOpen, Eye, EyeOff, Clock, CheckCircle2,
  XCircle, Send, MessageSquare, BarChart3, ArrowRight, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

type PartnerProfile = {
  _id: string;
  agencyName: string;
  status: string;
  revenueShare: number;
  totalEarnings: number;
  totalSales: number;
};

type TestSeries = {
  _id: string;
  title: string;
  examName: string;
  agencyName: string;
  status: string;
  visibility: string;
  questions: any[];
  totalEnrollments: number;
  totalRevenue: number;
  partnerEarnings: number;
  createdAt: string;
};

type EarningsData = {
  totalEarnings: number;
  totalSales: number;
  revenueShare: number;
  series: TestSeries[];
};

type Message = {
  _id: string;
  subject: string;
  message: string;
  adminReply: string;
  repliedAt: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-600',
  pending_review: 'bg-amber-500/10 text-amber-600',
  under_review: 'bg-blue-500/10 text-blue-600',
  approved: 'bg-green-500/10 text-green-600',
  published: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
};

export default function PartnerDashboard() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'messages'>('overview');
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' });
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, seriesRes, earningsRes, msgRes] = await Promise.all([
        api.get('/partner/profile'),
        api.get('/partner/test-series'),
        api.get('/partner/earnings'),
        api.get('/partner/messages'),
      ]);
      setProfile(profileRes.data);
      setSeries(seriesRes.data || []);
      setEarnings(earningsRes.data);
      setMessages(msgRes.data || []);
    } catch (err) {
      // Partner profile not found — user hasn't applied yet
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMsg(true);
    try {
      await api.post('/partner/messages', msgForm);
      setMsgForm({ subject: '', message: '' });
      setShowMsgForm(false);
      const msgRes = await api.get('/partner/messages');
      setMessages(msgRes.data || []);
    } catch (err) {
      // handle error
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleVisibility = async (seriesId: string) => {
    try {
      await api.patch(`/partner/test-series/${seriesId}/visibility`, {});
      loadData();
    } catch (err) {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-bold font-outfit mb-2">Not a Partner Yet</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You need to apply and be approved as a partner before accessing the dashboard.
          </p>
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Apply as Partner <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold font-outfit mb-2">Application Under Review</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Your partner application is being reviewed by our team.
          </p>
          <p className="text-xs text-muted-foreground">
            This usually takes 24-48 hours. You&apos;ll be notified once approved.
          </p>
        </div>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold font-outfit mb-2">Application Rejected</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your partner application was not approved. Please contact support for more details.
          </p>
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Reapply <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-outfit">Partner Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{profile.agencyName}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/partner/test-series/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> New Test Series
            </Link>
            <button
              onClick={() => setShowMsgForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all"
            >
              <Send className="w-4 h-4" /> Contact Admin
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          {(['overview', 'series', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Total Earnings</span>
                </div>
                <div className="text-2xl font-black">₹{earnings?.totalEarnings || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{earnings?.revenueShare || 40}% revenue share</p>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Total Sales</span>
                </div>
                <div className="text-2xl font-black">{earnings?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">enrollments across all series</p>
              </div>
              <div className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Test Series</span>
                </div>
                <div className="text-2xl font-black">{series.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {series.filter((s) => s.status === 'published').length} published
                </p>
              </div>
            </div>

            {/* Recent Series */}
            <div>
              <h3 className="font-bold text-sm mb-3">Recent Test Series</h3>
              {series.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-2xl">
                  <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No test series yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {series.slice(0, 5).map((s) => (
                    <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.examName} · {s.questions?.length || 0} questions</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[s.status] || ''}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Series Tab */}
        {activeTab === 'series' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {series.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No test series created yet.</p>
                <Link
                  href="/partner/test-series/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Create Test Series
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {series.map((s) => (
                  <div key={s._id} className="p-4 rounded-2xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm">{s.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.agencyName} · {s.examName} · {s.questions?.length || 0} questions
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[s.status] || ''}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                          {s.totalEnrollments > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {s.totalEnrollments} enrollments · ₹{s.partnerEarnings} earned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.status !== 'published' && (
                          <button
                            onClick={() => toggleVisibility(s._id)}
                            className={`p-2 rounded-lg text-xs transition-all ${
                              s.visibility === 'visible_to_admin'
                                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            title={s.visibility === 'visible_to_admin' ? 'Visible to admin' : 'Hidden from admin'}
                          >
                            {s.visibility === 'visible_to_admin' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Messages to Admin</h3>
              <button
                onClick={() => setShowMsgForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
              >
                <Send className="w-3 h-3" /> New Message
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m._id} className="p-4 rounded-2xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm">{m.subject}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{m.message}</p>
                    {m.adminReply && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold text-primary mb-1">Admin Reply</p>
                        <p className="text-xs">{m.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Send Message Modal */}
      {showMsgForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-outfit">Contact Admin</h2>
                <button onClick={() => setShowMsgForm(false)} className="p-2 rounded-xl hover:bg-muted">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Subject *</label>
                <input
                  type="text"
                  required
                  value={msgForm.subject}
                  onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                  placeholder="e.g. Question about test series"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={msgForm.message}
                  onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                  placeholder="Write your message..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sendingMsg}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {sendingMsg ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

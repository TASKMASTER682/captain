'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, CheckCircle2, XCircle, Clock, Eye, MessageSquare,
  DollarSign, BookOpen, ArrowRight, Loader2, BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';

type Partner = {
  _id: string;
  agencyName: string;
  contactEmail: string;
  status: string;
  totalEarnings: number;
  totalSales: number;
  revenueShare: number;
  createdAt: string;
  user: { name: string; email: string };
};

type TestSeries = {
  _id: string;
  title: string;
  examName: string;
  status: string;
  visibility: string;
  questions: any[];
  partner: { agencyName: string; user: { name: string; email: string } };
  createdAt: string;
};

type Message = {
  _id: string;
  subject: string;
  message: string;
  readByAdmin: boolean;
  adminReply: string;
  partner: { agencyName: string; user: { name: string; email: string } };
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  suspended: 'bg-gray-500/10 text-gray-600',
  draft: 'bg-gray-500/10 text-gray-600',
  pending_review: 'bg-amber-500/10 text-amber-600',
  under_review: 'bg-blue-500/10 text-blue-600',
  published: 'bg-green-500/10 text-green-600',
};

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<'partners' | 'series' | 'messages'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partnersRes, seriesRes, msgRes] = await Promise.all([
        api.get('/admin/partner/partners'),
        api.get('/admin/partner/partner-test-series'),
        api.get('/admin/partner/partner-messages'),
      ]);
      setPartners(partnersRes.data || []);
      setSeries(seriesRes.data || []);
      setMessages(msgRes.data || []);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPartner = async (id: string, action: string) => {
    try {
      await api.patch(`/admin/partner/partners/${id}/review`, { action });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-outfit">Partner Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage partners, test series, and messages</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          {(['partners', 'series', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'messages' && messages.filter((m) => !m.readByAdmin).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {messages.filter((m) => !m.readByAdmin).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {partners.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No partner applications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((p) => (
                  <div key={p._id} className="p-4 rounded-2xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{p.agencyName}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[p.status] || ''}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.user?.name} · {p.contactEmail} · Applied {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                        {p.totalSales > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.totalSales} sales · ₹{p.totalEarnings} earned
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReviewPartner(p._id, 'approve')}
                              className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewPartner(p._id, 'reject')}
                              className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/partners/${p._id}`}
                          className="px-3 py-1.5 bg-muted rounded-lg text-xs font-bold hover:bg-muted/80 transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Series Tab */}
        {activeTab === 'series' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex gap-2 mb-4">
              {['', 'pending_review', 'under_review', 'approved', 'published', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>

            {series.filter((s) => !filter || s.status === filter).length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No test series found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {series
                  .filter((s) => !filter || s.status === filter)
                  .map((s) => (
                    <div key={s._id} className="p-4 rounded-2xl border border-border bg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{s.title}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[s.status] || ''}`}>
                              {s.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.partner?.agencyName} · {s.examName} · {s.questions?.length || 0} questions
                          </p>
                        </div>
                        <Link
                          href={`/admin/partners/series/${s._id}`}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
                        >
                          Review <ArrowRight className="w-3 h-3" />
                        </Link>
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
            {messages.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No messages from partners.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m._id} className={`p-4 rounded-2xl border bg-card ${m.readByAdmin ? 'border-border' : 'border-primary/30'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{m.subject}</h4>
                          {!m.readByAdmin && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.partner?.agencyName} · {m.partner?.user?.name} · {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{m.message}</p>
                    {m.adminReply && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold text-primary mb-1">Your Reply</p>
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
    </div>
  );
}

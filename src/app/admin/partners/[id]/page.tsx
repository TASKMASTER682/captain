'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, Send,
  User, Mail, Phone, BookOpen, MessageSquare, FileText,
  DollarSign, BarChart3, Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';

type Partner = {
  _id: string;
  agencyName: string;
  contactEmail: string;
  contactPhone: string;
  examName: string;
  description: string;
  sampleQuestions: string;
  status: string;
  rejectionReason: string;
  revenueShare: number;
  totalEarnings: number;
  totalSales: number;
  createdAt: string;
  approvedAt: string;
  user: { name: string; email: string };
};

type Series = {
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

export default function AdminPartnerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/admin/partner/partners/${id}`);
      setPartner(res.data.partner);
      setSeries(res.data.series || []);
    } catch (err) {
      setError('Failed to load partner details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: string) => {
    setReviewing(true);
    setError('');
    try {
      await api.patch(`/admin/partner/partners/${id}/review`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });
      setSuccess(action === 'approve' ? 'Partner approved!' : 'Partner rejected.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed.');
    } finally {
      setReviewing(false);
      setShowReject(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Partner not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/partners" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-outfit">{partner.agencyName}</h1>
            <p className="text-xs text-muted-foreground">Partner Application</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[partner.status] || ''}`}>
            {partner.status}
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-xs mb-4">
            {success}
          </div>
        )}

        {/* Application Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Basic Info */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Application Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Partner Name</label>
                <p className="text-sm mt-0.5">{partner.user?.name || '—'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                <p className="text-sm mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  {partner.contactEmail}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                <p className="text-sm mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {partner.contactPhone || '—'}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Agency</label>
                <p className="text-sm mt-0.5">{partner.agencyName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Exam</label>
                <p className="text-sm mt-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  {partner.examName}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applied On</label>
                <p className="text-sm mt-0.5">{new Date(partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {partner.description && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Message
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {partner.description}
              </p>
            </div>
          )}

          {/* Sample Questions */}
          {partner.sampleQuestions && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Sample Questions
              </h3>
              <div className="p-4 rounded-xl bg-muted/50">
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/90 leading-relaxed">
                  {partner.sampleQuestions}
                </pre>
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {partner.status === 'rejected' && partner.rejectionReason && (
            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
              <h3 className="font-bold text-sm mb-2 text-red-600">Rejection Reason</h3>
              <p className="text-sm text-red-600/80">{partner.rejectionReason}</p>
            </div>
          )}

          {/* Earnings (if approved) */}
          {partner.status === 'approved' && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Earnings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue Share</label>
                  <p className="text-lg font-black text-primary">{partner.revenueShare}%</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Sales</label>
                  <p className="text-lg font-black">{partner.totalSales}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Earnings</label>
                  <p className="text-lg font-black">₹{partner.totalEarnings}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Series */}
          {series.length > 0 && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Test Series ({series.length})
              </h3>
              <div className="space-y-2">
                {series.map((s) => (
                  <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.questions?.length || 0} questions · {s.examName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[s.status] || ''}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                      {s.visibility === 'visible_to_admin' && (
                        <Eye className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Actions */}
          {partner.status === 'pending' && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-bold text-sm mb-4">Review Application</h3>
              {showReject ? (
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={reviewing}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowReject(false)}
                      className="px-4 py-3 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={reviewing}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve Partner
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex-1 py-3 bg-red-500/10 text-red-600 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

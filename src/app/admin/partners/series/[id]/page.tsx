'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, CheckCircle2, XCircle, Loader2, Send,
  Trash2, FileText, AlertCircle, Copy,
} from 'lucide-react';
import { api } from '@/lib/api';

type Question = {
  _id: string;
  rawText: string;
  formattedBody: string;
  formattedOptions: string;
  formattedCorrectAnswer: string;
  formattedExplanation: string;
  status: string;
};

type Series = {
  _id: string;
  title: string;
  examName: string;
  agencyName: string;
  testPlan: string;
  status: string;
  questions: Question[];
  partner: { agencyName: string; user: { name: string; email: string } };
  rejectionReason: string;
  adminNotes: string;
};

export default function AdminPartnerSeriesReviewPage() {
  const params = useParams();
  const seriesId = params?.id as string;

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadSeries();
  }, [seriesId]);

  const loadSeries = async () => {
    try {
      const res = await api.get(`/admin/partner/partner-test-series/${seriesId}`);
      setSeries(res.data);
    } catch (err) {
      setError('Failed to load test series.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFormatted = async () => {
    if (!series) return;
    const q = series.questions[activeQuestion];
    setSaving(true);
    setError('');
    try {
      await api.patch(
        `/admin/partner/partner-test-series/${series._id}/questions/${q._id}/format`,
        editingQuestion
      );
      setSuccess('Question formatted and saved.');
      setIsEditing(false);
      loadSeries();
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearFormatted = async (questionId: string) => {
    if (!series) return;
    setSaving(true);
    try {
      await api.patch(
        `/admin/partner/partner-test-series/${series._id}/questions/${questionId}/clear`,
        {}
      );
      loadSeries();
    } catch (err: any) {
      setError(err.message || 'Failed to clear.');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (action: string) => {
    if (!series) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/partner/partner-test-series/${series._id}/review`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });
      setSuccess(action === 'approve' ? 'Test series approved!' : 'Test series rejected.');
      loadSeries();
    } catch (err: any) {
      setError(err.message || 'Failed to review.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!series) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/admin/partner/partner-test-series/${series._id}/publish`, {});
      setSuccess(`Published! ${res.data.questionsCreated} questions created.`);
      loadSeries();
    } catch (err: any) {
      setError(err.message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  const copyRawToFormatted = (q: Question) => {
    setEditingQuestion({
      formattedBody: q.rawText,
      formattedOptions: '',
      formattedCorrectAnswer: '',
      formattedExplanation: '',
    });
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Test series not found.</p>
      </div>
    );
  }

  const currentQ = series.questions[activeQuestion];
  const formattedCount = series.questions.filter((q) => q.status === 'formatted' || q.status === 'approved').length;
  const totalCount = series.questions.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/partners" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-outfit">{series.title}</h1>
            <p className="text-xs text-muted-foreground">
              {series.partner?.agencyName} · {series.examName} · {series.partner?.user?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formattedCount}/{totalCount} formatted
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (formattedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Test Plan */}
        <div className="p-4 rounded-2xl border border-border bg-card mb-4">
          <h3 className="font-bold text-xs mb-2">Test Plan</h3>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{series.testPlan}</p>
        </div>

        {/* Question Navigation */}
        <div className="flex gap-1 flex-wrap mb-4">
          {series.questions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => {
                setActiveQuestion(i);
                setIsEditing(false);
                setEditingQuestion({});
              }}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === activeQuestion
                  ? 'bg-primary text-white'
                  : q.status === 'formatted'
                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Dual Question Boxes */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Left: Raw Text from Partner */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-bold text-xs">Partner&apos;s Raw Text</h3>
                </div>
                <button
                  onClick={() => copyRawToFormatted(currentQ)}
                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy to Editor
                </button>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 min-h-[200px]">
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/90">
                  {currentQ.rawText || 'No text provided.'}
                </pre>
              </div>
            </div>

            {/* Right: Formatted Text (Admin Editor) */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-xs">Formatted Output (Parser Ready)</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  currentQ.status === 'formatted' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {currentQ.status === 'formatted' ? 'Formatted' : 'Needs Formatting'}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Question Body *</label>
                    <textarea
                      rows={4}
                      value={editingQuestion.formattedBody || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, formattedBody: e.target.value })}
                      placeholder="Paste formatted question body here..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Options</label>
                    <textarea
                      rows={3}
                      value={editingQuestion.formattedOptions || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, formattedOptions: e.target.value })}
                      placeholder={"A) Option 1\nB) Option 2\nC) Option 3\nD) Option 4"}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Correct Answer</label>
                      <input
                        type="text"
                        value={editingQuestion.formattedCorrectAnswer || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, formattedCorrectAnswer: e.target.value })}
                        placeholder="A"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Explanation</label>
                      <input
                        type="text"
                        value={editingQuestion.formattedExplanation || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, formattedExplanation: e.target.value })}
                        placeholder="Explanation..."
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveFormatted}
                      disabled={saving || !editingQuestion.formattedBody}
                      className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : currentQ.formattedBody ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-muted/50 min-h-[100px]">
                    <pre className="text-xs whitespace-pre-wrap font-mono">{currentQ.formattedBody}</pre>
                  </div>
                  {currentQ.formattedOptions && (
                    <div className="p-3 rounded-xl bg-muted/50">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{currentQ.formattedOptions}</pre>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion({
                          formattedBody: currentQ.formattedBody,
                          formattedOptions: currentQ.formattedOptions,
                          formattedCorrectAnswer: currentQ.formattedCorrectAnswer,
                          formattedExplanation: currentQ.formattedExplanation,
                        });
                        setIsEditing(true);
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleClearFormatted(currentQ._id)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => copyRawToFormatted(currentQ)}
                  className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:bg-muted hover:border-primary/30 transition-all"
                >
                  Click &quot;Copy to Editor&quot; to start formatting
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setActiveQuestion(Math.max(0, activeQuestion - 1)); setIsEditing(false); }}
            disabled={activeQuestion === 0}
            className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted disabled:opacity-30 transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Question {activeQuestion + 1} of {totalCount}
          </span>
          <button
            onClick={() => { setActiveQuestion(Math.min(totalCount - 1, activeQuestion + 1)); setIsEditing(false); }}
            disabled={activeQuestion >= totalCount - 1}
            className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted disabled:opacity-30 transition-all"
          >
            Next
          </button>
        </div>

        {/* Review Actions */}
        {series.status !== 'published' && (
          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-sm mb-4">Review Actions</h3>

            {series.status === 'approved' && (
              <div className="mb-4">
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Test Series
                </button>
              </div>
            )}

            {(series.status === 'under_review' || series.status === 'pending_review') && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={saving || formattedCount < totalCount}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setReviewAction('reject')}
                    className="flex-1 py-3 bg-red-500/10 text-red-600 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>

                {formattedCount < totalCount && (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg">
                    Format all {totalCount - formattedCount} remaining questions before approving.
                  </p>
                )}

                {reviewAction === 'reject' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                    />
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={saving}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            )}

            {series.status === 'rejected' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                <p className="font-bold">Rejected</p>
                {series.rejectionReason && <p className="mt-1">{series.rejectionReason}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

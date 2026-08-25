'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function CreateTestSeriesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    agencyName: '',
    examName: '',
    testPlan: '',
    subjects: '',
    questionsPerTest: 30,
    price: 0,
    suggestedPrice: 0,
  });

  const [questions, setQuestions] = useState<string[]>(['']);
  const [seriesId, setSeriesId] = useState<string | null>(null);

  const handleCreateSeries = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/partner/test-series', {
        ...form,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSeriesId(res.data._id);
      setSuccess('Test series created. Now add your questions below.');
    } catch (err: any) {
      setError(err.message || 'Failed to create test series.');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => setQuestions([...questions, '']);
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };
  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleSaveQuestions = async () => {
    if (!seriesId) return;
    setError('');
    setSaving(true);
    try {
      const validQuestions = questions.filter((q) => q.trim());
      if (validQuestions.length === 0) {
        setError('Add at least one question.');
        setSaving(false);
        return;
      }
      await api.post(`/partner/test-series/${seriesId}/questions`, {
        questions: validQuestions.map((q) => ({ rawText: q })),
      });
      setSuccess(`${validQuestions.length} questions saved. You can now make this visible to admin for review.`);
    } catch (err: any) {
      setError(err.message || 'Failed to save questions.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!seriesId) return;
    setSaving(true);
    try {
      await api.patch(`/partner/test-series/${seriesId}/visibility`, {});
      setSuccess('Visibility updated. Admin can now review your test series.');
      router.push('/partner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/partner/dashboard" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-outfit">Create Test Series</h1>
            <p className="text-xs text-muted-foreground">Fill in details and add questions as plain text</p>
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

        {/* Step 1: Series Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
              <h2 className="font-bold text-sm">Test Series Details</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. SSC CGL 2025 Complete Pack"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Agency *</label>
                  <input
                    type="text"
                    required
                    value={form.agencyName}
                    onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                    placeholder="e.g. SSC"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Exam *</label>
                  <input
                    type="text"
                    required
                    value={form.examName}
                    onChange={(e) => setForm({ ...form, examName: e.target.value })}
                    placeholder="e.g. CGL"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the test series..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Full Test Plan *</label>
                <textarea
                  rows={4}
                  required
                  value={form.testPlan}
                  onChange={(e) => setForm({ ...form, testPlan: e.target.value })}
                  placeholder={"Describe your test series plan:\n- Test 1: Quantitative Aptitude (30 questions)\n- Test 2: Reasoning (30 questions)\n- Test 3: English (30 questions)\n..."}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Subjects</label>
                  <input
                    type="text"
                    value={form.subjects}
                    onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                    placeholder="Quant, Reasoning, English"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Questions/Test</label>
                  <input
                    type="number"
                    value={form.questionsPerTest}
                    onChange={(e) => setForm({ ...form, questionsPerTest: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Price (₹)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Suggested Price (₹)</label>
                  <input
                    type="number"
                    value={form.suggestedPrice}
                    onChange={(e) => setForm({ ...form, suggestedPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {!seriesId && (
                <button
                  onClick={handleCreateSeries}
                  disabled={saving || !form.title || !form.agencyName || !form.examName || !form.testPlan}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create Test Series
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Step 2: Add Questions */}
        {seriesId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                <h2 className="font-bold text-sm">Add Questions (Plain Text)</h2>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs mb-4 flex items-start gap-2">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Minimum 20 questions required.</p>
                  <p className="mt-0.5">Paste questions as plain text. Our admin will convert them to the required format.</p>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] text-muted-foreground mt-3 w-5 shrink-0 text-right">{i + 1}.</span>
                    <textarea
                      rows={3}
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                      placeholder={`Question ${i + 1}...\nA) Option A\nB) Option B\nC) Option C\nD) Option D\nAnswer: A\nExplanation: ...`}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-xs"
                    />
                    <button
                      onClick={() => removeQuestion(i)}
                      disabled={questions.length <= 1}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed self-start mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={addQuestion}
                  className="flex-1 py-2.5 border border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveQuestions}
                  disabled={saving}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Questions ({questions.filter((q) => q.trim()).length})
                </button>
              </div>
            </div>

            {/* Step 3: Submit for Review */}
            <div className="p-5 rounded-2xl border border-border bg-card mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                <h2 className="font-bold text-sm">Submit for Review</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Once you&apos;ve added all questions, make this visible to admin. They will review, format, and publish your test series.
              </p>
              <button
                onClick={handleToggleVisibility}
                disabled={saving}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Make Visible to Admin for Review
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

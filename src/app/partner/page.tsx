'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Handshake, CheckCircle2, XCircle, FileText, Send, Shield,
  BarChart3, DollarSign, Users, BookOpen, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

const CONDITIONS = [
  {
    icon: BookOpen,
    title: 'No Syllabus Deviation',
    description: 'All questions must strictly adhere to the official syllabus. Out-of-syllabus content will be rejected.',
  },
  {
    icon: Shield,
    title: 'Zero AI Slop',
    description: 'Questions must be original, well-researched, and human-crafted. AI-generated low-quality content is strictly prohibited.',
  },
  {
    icon: BarChart3,
    title: 'Balanced Difficulty',
    description: 'Tests must maintain a proper balance of Easy, Medium, and Hard questions. No excessively easy or hard papers.',
  },
  {
    icon: FileText,
    title: 'Minimum 20 Sample Questions',
    description: 'Submit at least 20 sample questions with your test series application for review.',
  },
  {
    icon: CheckCircle2,
    title: 'Quality Standards',
    description: 'Questions must be accurate, well-formatted, and include clear explanations for correct answers.',
  },
  {
    icon: Users,
    title: 'Verified Before Publishing',
    description: 'Every test series undergoes admin verification before going live. Only quality content is published.',
  },
];

const STEPS = [
  { step: 1, title: 'Apply as Partner', description: 'Fill out the application form with your agency details.' },
  { step: 2, title: 'Get Approved', description: 'Our team reviews your application within 48 hours.' },
  { step: 3, title: 'Submit Test Series', description: 'Create test series and submit questions as plain text.' },
  { step: 4, title: 'Admin Verification', description: 'Admin reviews, formats, and approves your questions.' },
  { step: 5, title: 'Go Live & Earn', description: 'Published series earn 40% revenue share on every sale.' },
];

export default function PartnerPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    agencyName: '',
    contactPhone: '',
    examName: '',
    description: '',
    sampleQuestions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/partner/apply', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold font-outfit mb-2">Application Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your interest in becoming a partner. Our team will review your application and get back to you within 48 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
              <Handshake className="w-3.5 h-3.5" />
              PARTNER PROGRAM
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-outfit tracking-tight mb-4">
              Partner with ExamOS
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Share your test series with thousands of students. Earn 40% revenue on every sale while we handle the platform, payments, and distribution.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold font-outfit text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center p-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-3">
                {s.step}
              </div>
              <h3 className="font-bold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.description}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-5 -right-2 text-muted-foreground/30">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Conditions */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <h2 className="text-2xl font-bold font-outfit text-center mb-4">Partner Guidelines</h2>
        <p className="text-center text-muted-foreground text-sm mb-12 max-w-xl mx-auto">
          Please review these requirements before applying. All test series are verified against these standards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONDITIONS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl border border-border bg-card"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Revenue Split */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold font-outfit mb-2">Revenue Sharing</h2>
          <p className="text-muted-foreground text-sm">Transparent and fair revenue distribution</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
          <div className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-black text-primary">40%</div>
            <div className="text-sm font-bold mt-1">Your Share</div>
            <p className="text-xs text-muted-foreground mt-2">Of every sale goes directly to you</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-3xl font-black">60%</div>
            <div className="text-sm font-bold mt-1">Platform Share</div>
            <p className="text-xs text-muted-foreground mt-2">Covers hosting, payments, and distribution</p>
          </div>
        </div>
      </section>

      {/* What to Submit */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <h2 className="text-2xl font-bold font-outfit text-center mb-4">What You Need to Submit</h2>
        <p className="text-center text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
          When creating a test series, you&apos;ll need to provide the following information:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            'Test Series Name',
            'Agency / Organization Name',
            'Exam Name',
            'Full Test Series Plan (structure, topics, question count)',
            'Minimum 20 Sample Questions (plain text format)',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold font-outfit mb-2">Ready to Partner?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Applications are reviewed within 48 hours. Only quality test series that meet our standards will be approved.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Apply as Partner <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-outfit">Partner Application</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Fill in your details to apply</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  Agency / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  placeholder="e.g. JKSSB, SSC, BPSC"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.examName}
                  onChange={(e) => setForm({ ...form, examName: e.target.value })}
                  placeholder="e.g. CGL, CPO, JE, SI"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  Type Your Message
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell us about your test series, experience, and what you plan to offer..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  Paste Sample Questions *
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.sampleQuestions}
                  onChange={(e) => setForm({ ...form, sampleQuestions: e.target.value })}
                  placeholder={"Paste 2-3 sample questions that represent the best of your ability:\n\nQ1. What is the capital of France?\nA) London  B) Berlin  C) Paris  D) Madrid\nAnswer: C\n\nQ2. ..."}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">These help us evaluate your question quality before approval.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application
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

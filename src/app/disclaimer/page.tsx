'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 border-b border-border pb-6">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="ExamOS" className="w-12 h-12 rounded-xl shadow-md shadow-primary/20 object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-outfit text-primary">Disclaimer</h1>
            <p className="text-sm text-muted-foreground">Last Updated: August 2026</p>
          </div>
        </div>

        {/* Non-Affiliation Notice */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">Non-Affiliation Notice</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>ExamOS is an independent educational technology platform operated by ExamOS Inc.</strong> ExamOS is <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected with</strong> any government agency, examination authority, or official body (including but not limited to SSC, IBPS, UPSC, NTA, RRB, SBI, or State Public Service Commissions).
          </p>
        </div>

        {/* Educational Purpose Only */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">Educational Purpose Only</h2>
          <p className="text-muted-foreground leading-relaxed">
            All Computer-Based Tests (CBT), mock questions, speed analytics, AI-generated solutions, and study materials provided on ExamOS are created solely for practice and educational purposes.
          </p>
        </div>

        {/* No Guarantee of Results */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-red-600 mb-4">No Guarantee of Results</h2>
          <p className="text-muted-foreground leading-relaxed">
            While our CBT engine models real examination environments and analytics, ExamOS does not guarantee success, selection, or specific scores in any official competitive examination. Official examination patterns, syllabus, and schedules are subject to change by respective governing bodies.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-border">
          <a 
            href="/test-series" 
            className="text-primary hover:text-primary/90 transition-colors"
          >
            ← Back to Test Series
          </a>
        </div>
      </div>
    </div>
  );
}
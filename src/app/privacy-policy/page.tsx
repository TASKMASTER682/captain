'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 border-b border-border pb-6">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="ExamOS" className="w-12 h-12 rounded-xl shadow-md shadow-primary/20 object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-outfit text-primary">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last Updated: August 2026</p>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">1. Information We Collect</h2>
          <div className="text-muted-foreground space-y-3">
            <p className="font-medium">Account Data:</p>
            <span className="ml-4 text-sm">Name, email address, target exam preferences, profile avatar.</span>
            <p className="font-medium mt-3">Performance Data:</p>
            <span className="ml-4 text-sm">Test scores, time-per-question metrics, topic accuracy heatmaps, spaced-repetition queues, and streak logs.</span>
            <p className="font-medium mt-3">Technical Data:</p>
            <span className="ml-4 text-sm">IP address, browser type, device details (for fullscreen security and offline resilience synchronization).</span>
          </div>
        </div>

        {/* How We Use Your Data */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">2. How We Use Your Data</h2>
          <div className="text-muted-foreground space-y-3">
            <p>To deliver granular speed analytics, adaptive test surfacing, and spaced-repetition revision queues.</p>
            <p>To process AI doubt-solving queries and render step-by-step mathematical solutions.</p>
            <p>To maintain global and test-specific leaderboards (displaying public usernames and ranks).</p>
          </div>
        </div>

        {/* Data Security & Storage */}
        <div className="bg-muted/5 border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">3. Data Security & Storage</h2>
          <p className="text-muted-foreground">
            All performance metrics and analytical computations are processed securely. We do not sell or trade your personal data to third-party marketers.
          </p>
        </div>

        {/* Cookies & Tracking */}
        <div className="bg-muted/5 border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold font-outfit text-primary mb-4">4. Cookies & Tracking</h2>
          <p className="text-muted-foreground">
            We use essential session cookies to keep you logged in, persist test states during connectivity drops, and enforce exam security.
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
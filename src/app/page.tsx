'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { getAuthUser } from '@/lib/api';
import { Sun, Moon, Shield, Award, BarChart2, CheckCircle2, ArrowRight, LayoutDashboard, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setLoggedIn(true);
      setUserRole(user.role);
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/announcements/active`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data?.data) ? data.data : []))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            Ω
          </div>
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent font-outfit">
            ExamOS
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          
          {loggedIn ? (
            <Link href={userRole === 'Super Admin' ? '/admin/dashboard' : '/dashboard'} className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 font-medium transition-all shadow-md shadow-primary/20 text-sm flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2.5 rounded-xl border border-border bg-card text-card-foreground hover:bg-muted font-medium transition-all text-sm">
                Sign In
              </Link>
              <Link href="/login?mode=signup" className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 font-medium transition-all shadow-md shadow-primary/20 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide w-fit">
            <Award className="w-3.5 h-3.5" /> THE NEXT GENERATION ASSESSMENT PLATFORM
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold font-outfit leading-tight tracking-tight">
            The Computer Based Test <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Operating System</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
            Empower your competitive examination prep with real government-standard CBT environments. Centralized question banks, multi-level analytics, spaced repetition revision, and offline sync backups.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-center flex items-center justify-center gap-2 group shadow-lg shadow-primary/30"
            >
              Access Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-border bg-card text-card-foreground hover:bg-muted font-medium transition-all text-center"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        {/* Right Preview - Mock Screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="text-xs text-muted-foreground ml-2 font-mono">CBT ENGINE v1.2</span>
            </div>
            <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-semibold tracking-wider font-mono">LIVE PREVIEW</span>
          </div>

          {/* Dummy Question Interface */}
          <div className="flex flex-col gap-4 font-sans text-sm">
            <div className="flex justify-between text-xs text-muted-foreground border-b border-border/50 pb-2">
              <span>Section: General Intelligence</span>
              <span className="font-mono text-primary font-bold">Time Left: 47:19</span>
            </div>
            <div className="font-bold text-foreground">
              Q12. What is the value of 5x + 3y, if x is the third prime number and y is the smallest composite number?
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5 text-foreground font-semibold">
                <span className="w-6 h-6 rounded-lg bg-primary text-white text-xs flex items-center justify-center font-bold">A</span>
                <span>37 (Correct Option)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <span className="w-6 h-6 rounded-lg bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">B</span>
                <span>41</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <span className="px-4 py-2 rounded-lg bg-secondary text-xs font-medium">Mark for Review</span>
              <div className="flex gap-2">
                <span className="px-4 py-2 rounded-lg border border-border text-xs font-medium">Clear</span>
                <span className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium shadow-md shadow-primary/20">Save & Next</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="py-8 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold font-outfit">Announcements</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((a: any) => {
                const accent = a.accentColor || '#6366f1';
                return (
                  <div key={a._id} className="flex flex-col gap-1.5 p-4 rounded-2xl shadow-sm" style={{ border: `1px solid ${accent}33`, backgroundColor: `${accent}08` }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm font-outfit">{a.title}</span>
                      {a.type && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: `${accent}15`, color: accent }}>{a.type}</span>}
                    </div>
                    {a.message && <p className="text-xs text-muted-foreground leading-relaxed">{a.message}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section id="features" className="py-24 bg-secondary/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">Built to Scale, Designed to Perform</h2>
            <p className="text-muted-foreground">Every component of ExamOS has been engineered to model exact test interfaces while feeding a hyper-precise diagnostic algorithm.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-border bg-card flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit">Authentic CBT Engine</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Runs in secure full-screen browser mode with Section Locking, auto-saving checkpoints, and offline resilience during network drops.</p>
            </div>

            <div className="p-8 rounded-3xl border border-border bg-card flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit">Granular Speed Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Rule-based scoring, accuracy index, solving-speed indicators, topic heatmaps, and EER index. Calculated entirely client-side without paid APIs.</p>
            </div>

            <div className="p-8 rounded-3xl border border-border bg-card flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit">Spaced Repetition & Adaptive Practice</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Automatically indexes incorrect questions. Leverages Day 1, 3, 7, 15, and 30 queues, optimizing long-term retention levels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 ExamOS Inc. All rights reserved. Made for professional, enterprise-scale CBT examination training.
      </footer>
    </div>
  );
}

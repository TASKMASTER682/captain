'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';
import { getAuthUser, API_BASE } from '@/lib/api';
import {
  Sun, Moon, ArrowRight, LayoutDashboard, ChevronDown, Sparkles, Shield, BarChart2,
  BrainCircuit, Bot, BookOpen, Trophy, Timer, Monitor, Wifi,
  Target, Play, GraduationCap, Flame, Crown, Star, Quote, Cpu,
  DraftingCompass, Globe, Weight, Layers, TrendingUp, Award, Menu, X,
  ClipboardList, Newspaper, NotebookPen, SquarePen, Bookmark, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- Shared animation variants ----------
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] as any },
  }),
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      custom={delay}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------- Stats that count up ----------
function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let start: number | null = null;
    const duration = 1600;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { raf = requestAnimationFrame(step); obs.disconnect(); } });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// ---------- Sections ----------

const heroFeatures = [
  { icon: Shield, label: 'Govt-standard CBT Engine' },
  { icon: BarChart2, label: 'Granular Speed Analytics' },
  { icon: BrainCircuit, label: 'Spaced Repetition' },
];

const featureItems = [
  {
    icon: Sparkles,
    name: 'Smart Recommendations',
    tag: 'Personalised',
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    text: 'Test series, notes and practice sets picked for you — based on your exam, weak topics and daily progress.',
  },
  {
    icon: Bot,
    name: 'AI Doubt Solving',
    tag: '24x7 Help',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    text: 'Stuck on a question? Ask anytime and get an instant step-by-step solution with rendered math and explanations.',
  },
  {
    icon: SquarePen,
    name: 'Create Your Own Test',
    tag: 'Custom Mocks',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    text: 'Build your own mock — choose subjects, topics, number of questions, difficulty level and time limit.',
  },
  {
    icon: Bookmark,
    name: 'Save Questions from Tests',
    tag: 'Bookmarks',
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    text: 'Bookmark tricky questions while attempting any test and revise them later from one place.',
  },
  {
    icon: Zap,
    name: 'Free Live Tests',
    tag: 'Live & Free',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    text: 'Scheduled live tests taken by thousands of aspirants together — real exam-day competition, completely free.',
  },
  {
    icon: Trophy,
    name: 'Leaderboard & Rankings',
    tag: 'Compete',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    text: 'All-India ranks, XP and streaks — see exactly where you stand among toppers every week.',
  },
];

const steps = [
  {
    icon: GraduationCap, step: '01', title: 'Personalise',
    text: 'Select your exam board and agencies so every recommendation matches the syllabus you are actually preparing for.',
  },
  {
    icon: Play, step: '02', title: 'Practice',
    text: 'Attempt scheduled mocks, topic practice and learning-mode drills in the exact CBT environment you will face on exam day.',
  },
  {
    icon: TrendingUp, step: '03', title: 'Improve',
    text: 'See per-topic speed and accuracy trends, then hit the spaced-repetition queue to convert weaknesses into strengths.',
  },
];

const testRows = [
  { icon: Cpu, title: 'Synchronous Programming', sub: 'Debounce · closures · event loop', stat: '92% accuracy', tone: 'text-emerald-500' },
  { icon: DraftingCompass, title: 'Mathematics — Number System', sub: 'LCM/HCF · divisibility', stat: 'Speed boost +18%', tone: 'text-amber-500' },
  { icon: Globe, title: 'Current Affairs — August', sub: 'Economy · national news', stat: 'Streak +3 days', tone: 'text-sky-500' },
  { icon: Weight, title: 'Reasoning — Puzzle Sets', sub: 'Sitting arrangement', stat: 'Next revision: today', tone: 'text-violet-500' },
];

const testimonials = [
  {
    name: 'Aarav Sharma', role: 'SSC CGL Aspirant', initials: 'AS',
    quote: 'The CBT engine feels identical to the real exam hall. My speed-per-topic analytics showed exactly where I was losing 10 minutes each mock.',
  },
  {
    name: 'Sneha Iyer', role: 'IBPS PO Candidate', initials: 'SI',
    quote: 'I asked a doubt at midnight and got a step-by-step AI solution with the math rendered perfectly. The revision queue genuinely fixed my weak areas.',
  },
  {
    name: 'Rohan Verma', role: 'UPSC Prelims', initials: 'RV',
    quote: 'Streaks and leaderboards kept me consistent for 90 days straight. The spaced repetition caught concepts I forgot within a week of learning them.',
  },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    if (user) { setLoggedIn(true); setUserRole(user.role); }
    fetch(`${API_BASE}/announcements/active`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data?.data) ? data.data : []))
      .catch(() => {});
  }, []);

  const dashHref = userRole === 'Super Admin' ? '/admin/dashboard' : '/dashboard';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [featuresGlow, setFeaturesGlow] = useState(false);

  const navLinks = [
    { label: 'Test Series', href: '/explore' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Partner', href: '/partner' },
    { label: 'Mock Tests', href: '#mock-tests' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Topper Reviews', href: '#topper-reviews' },
  ];

  // Smooth-scroll past the sticky header, then flash the section so the
  // click clearly did something.
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
    if (id === 'features') {
      setFeaturesGlow(true);
      window.setTimeout(() => setFeaturesGlow(false), 1800);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 overflow-x-clip">

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full">
        <div className="glass border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <Image src="/logo.png" alt="ExamOS" width={40} height={40} priority className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-primary/20 object-cover group-hover:rotate-6 transition-transform duration-300" />
              <span className="font-bold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent font-outfit">
                ExamOS
              </span>
            </Link>

            {/* Desktop nav — pill links with gradient underline sweep */}
            <nav className="hidden lg:flex items-center gap-0.5 text-sm font-medium text-muted-foreground">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="group relative px-3.5 py-2 rounded-full hover:text-foreground hover:bg-muted/70 transition-colors">
                  {l.label}
                  <span className="absolute inset-x-3.5 bottom-[3px] h-[2px] rounded-full bg-gradient-to-r from-primary to-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </Link>
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>

              {loggedIn ? (
                <Link href={dashHref} className="hidden sm:flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:brightness-110 font-medium transition-all shadow-md shadow-primary/25 text-sm items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> <span className="hidden md:inline">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:flex px-4 sm:px-5 py-2.5 rounded-xl border border-border bg-card text-card-foreground hover:bg-muted font-medium transition-all text-sm items-center">
                    Sign In
                  </Link>
                  <Link href="/login?mode=signup" className="hidden sm:flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:brightness-110 font-medium transition-all shadow-md shadow-primary/25 text-sm items-center">
                    Get Started
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="lg:hidden p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="lg:hidden absolute top-full inset-x-0 px-4 pt-2"
            >
              <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-1">
                {navLinks.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      href={l.href}
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {l.label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    </Link>
                  </motion.div>
                ))}

                <div className="h-px bg-border my-2" />
                {loggedIn ? (
                  <Link href={dashHref} onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm shadow-md shadow-primary/25">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-xl border border-border bg-card font-medium text-sm hover:bg-muted transition-colors">
                      Sign In
                    </Link>
                    <Link href="/login?mode=signup" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm shadow-md shadow-primary/25">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative isolate">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-primary/20 blur-[120px] animate-glow" />
        <div className="pointer-events-none absolute top-40 -right-32 w-[30rem] h-[30rem] rounded-full bg-accent/40 blur-[120px] animate-glow" style={{ animationDelay: '1.5s' }} />

        <main className="relative max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left copy — CSS entrance animation (desktop only via .hero-fade-in),
              mobile renders visible immediately for a fast LCP. */}
          <div className="hero-fade-in flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide w-fit">
              <Sparkles className="w-3.5 h-3.5" /> ONLINE EXAM PREPARATION PLATFORM
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-outfit leading-[1.05] tracking-tight">
              Crack government exams with
              <span className="shimmer-text bg-gradient-to-r from-primary via-accent to-primary text-transparent"> real mock tests</span>,
              <br className="hidden sm:block" />
              free study material &amp; current affairs.
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              ExamOS is a complete exam preparation platform — full-length test series, CBT mock tests, study notes,
              daily current affairs and detailed performance analysis for SSC, Banking, Railways, UPSC and other government exams.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
              {heroFeatures.map((f, i) => (
                <span key={f.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
                  <f.icon className="w-3.5 h-3.5 text-primary" /> {f.label}
                  {i < heroFeatures.length - 1 && <span className="text-border ml-1 hidden sm:inline">•</span>}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <Link
                href={loggedIn ? dashHref : '/login'}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-center flex items-center justify-center gap-2 group shadow-lg shadow-primary/30"
              >
                {loggedIn ? 'Enter Dashboard' : 'Access Engine'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="group w-full sm:w-auto px-8 py-4 rounded-2xl border border-border bg-card text-card-foreground hover:bg-muted font-medium transition-all text-center flex items-center justify-center gap-2"
              >
                Explore Features <ChevronDown className="w-4 h-4 text-primary group-hover:translate-y-1 transition-transform" />
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex -space-x-2">
                {['A', 'S', 'R', 'K'].map((c, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-tr from-primary/80 to-accent/80 text-white text-[10px] font-bold flex items-center justify-center">
                    {c}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">4.9/5</span> from 2,000+ toppers
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </div>
          </div>

          {/* Right — CBT mock */}
          <div className="relative hero-fade-in-delay">
            {/* Glow behind preview */}
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 blur-2xl" />

            <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl shadow-primary/10">
              {/* Window chrome */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-[11px] text-muted-foreground ml-2 font-mono">CBT ENGINE v2.3 — Fullscreen Mode</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 text-[10px] font-semibold tracking-wider font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-blink" /> LIVE
                </span>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/60 bg-muted/30">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Monitor className="w-3.5 h-3.5 text-primary" /> Fullscreen Locked
                  <span className="text-border mx-1">|</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Auto-Saved
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-full">
                  <Timer className="w-3 h-3" /> 47:19 left
                </div>
              </div>

              {/* Question body */}
              <div className="p-5 flex flex-col gap-3">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Section: General Intelligence</span>
                  <span>Q12 / 100</span>
                </div>
                <div className="font-semibold text-sm leading-relaxed">
                  If <span className="font-mono text-primary">5x + 3y</span> where x is the 3rd prime and y is the smallest composite number, what is the result?
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5">
                    <span className="w-6 h-6 rounded-lg bg-primary text-white text-[11px] flex items-center justify-center font-bold">A</span>
                    <span className="text-sm font-medium">37</span>
                    <span className="ml-auto text-[10px] font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">Correct ✓</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <span className="w-6 h-6 rounded-lg bg-secondary text-secondary-foreground text-[11px] flex items-center justify-center font-bold">B</span>
                    <span className="text-sm text-muted-foreground">41</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <span className="w-6 h-6 rounded-lg bg-secondary text-secondary-foreground text-[11px] flex items-center justify-center font-bold">C</span>
                    <span className="text-sm text-muted-foreground">45</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                  <span className="px-3 py-1.5 rounded-lg bg-secondary text-[11px] font-medium text-secondary-foreground">Mark for Review</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg border border-border text-[11px] text-muted-foreground">Clear Response</span>
                    <span className="px-4 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-md shadow-primary/30">Save & Next →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chip: AI doubt */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -left-4 sm:-left-8 top-8 animate-float"
            >
              <div className="px-4 py-3 rounded-2xl bg-card border border-border shadow-xl shadow-primary/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-primary text-white flex items-center justify-center"><Bot className="w-5 h-5" /></div>
                <div>
                  <p className="text-[11px] font-bold">AI Doubt Saved</p>
                  <p className="text-[10px] text-muted-foreground">Solution solved step-by-step</p>
                </div>
              </div>
            </motion.div>

            {/* Floating chip: Gamification */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -right-3 sm:-right-6 bottom-20 animate-float-slow"
            >
              <div className="px-4 py-3 rounded-2xl bg-card border border-border shadow-xl shadow-amber-500/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Flame className="w-5 h-5 fill-amber-500/40" /></div>
                <div>
                  <p className="text-[11px] font-bold">14-Day Streak</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> Rank #12 in SSC Leaderboard</p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </section>

      {/* ============ STATS BAND ============ */}
      <section className="relative border-y border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Practice Questions', target: 15000, suffix: '+' },
            { label: 'Mock CBT Tests', target: 480, suffix: '+' },
            { label: 'Toppers Trained', target: 20000, suffix: '+' },
            { label: 'Avg. Accuracy Gain', target: 94, suffix: '%' },
          ].map((s) => (
            <Reveal key={s.label} className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-outfit bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                <CountUp target={s.target} suffix={s.suffix} />
              </span>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ WHAT YOU GET (prep cards — links to signup/dashboard) ============ */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12 flex flex-col gap-4">
            <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">EVERYTHING FOR YOUR EXAM PREPARATION</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">All your exam prep tools, in one place</h2>
            <p className="text-muted-foreground">Test series, study material, current affairs and performance tracking — start free and prepare for every government exam.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prepCards.map((c, i) => (
              <Reveal key={c.title} delay={i}>
                <Link
                  href={loggedIn ? dashHref : '/login?mode=signup'}
                  className="group h-full flex flex-col gap-4 p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <h3 className="text-base font-bold font-outfit group-hover:text-primary transition-colors">{c.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mt-auto">
                    {loggedIn ? 'Open Dashboard' : 'Start Free'}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MOCK TESTS (real exam experience) ============ */}
      <section id="mock-tests" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="flex flex-col gap-5">
              <span className="w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">REAL EXAM EXPERIENCE</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit leading-tight">
                Mock tests that feel exactly like<br className="hidden sm:block" /> the <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">real exam hall</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Every mock runs inside our locked-down CBT wrapper: fullscreen enforcement, per-section timing with mandatory
                section locking, auto-save on every answer, and offline resilience so a network drop never ends your test.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row mt-2">
                {[
                  { k: 'Fullscreen lock', v: 'Browser controls disabled while test is live' },
                  { k: 'Auto-save', v: 'Answers persisted on every click' },
                  { k: 'Offline resilient', v: 'Continues even with connectivity loss' },
                ].map((f, i) => (
                  <div key={f.k} className="flex-1 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                    <div className="text-lg font-bold font-outfit bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">0{i + 1}</div>
                    <div className="text-sm font-bold mt-1">{f.k}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Mock second screen: section list */}
          <Reveal delay={1}>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <span className="text-sm font-bold font-outfit flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Section Locking</span>
                <span className="text-[10px] text-muted-foreground font-mono">LOCKED SEQUENTIAL</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { name: 'General Intelligence', q: '25 Qs · 15 min', tone: 'text-emerald-500', status: 'Completed' },
                  { name: 'Quantitative Aptitude', q: '25 Qs · 25 min', tone: 'text-amber-500', status: 'Current' },
                  { name: 'English Language', q: '25 Qs · 20 min', tone: 'text-sky-500', status: 'Locked' },
                  { name: 'General Awareness', q: '25 Qs · 20 min', tone: 'text-violet-500', status: 'Locked' },
                ].map((s, i) => (
                  <div key={s.name} className="p-4 rounded-2xl border border-border bg-background hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary text-[11px] font-bold">{i + 1}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.q}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-card border border-border ${s.tone}`}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Attempt adaptive:</span> weak topics surface first to maximise marks-per-minute.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURES GRID ============ */}
      <section id="features" className="relative py-24 bg-secondary/50 border-y border-border overflow-hidden">
        {/* Click feedback glow (triggered from hero "Explore Features") */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${featuresGlow ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.12), transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-4">
            <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">ALL PREP TOOLS</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">Everything you need to crack your exam</h2>
            <p className="text-muted-foreground">Practice, analysis, revision and daily reading — six modules that cover your entire preparation.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureItems.map((f, i) => (
              <Reveal key={f.name} delay={i}>
                <div className="group h-full p-7 rounded-3xl border border-border bg-card hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.color}`}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${f.color}`}>{f.tag}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="text-lg font-bold font-outfit group-hover:text-primary transition-colors">{f.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={2} className="mt-10 text-center">
            <Link href={loggedIn ? dashHref : '/login'} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 font-medium transition-all group">
              Unlock the full engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-4">
            <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">YOUR DAILY LOOP</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">Three steps. Repeat daily.</h2>
            <p className="text-muted-foreground">From the first avatar to the final report, the whole journey lives inside ExamOS.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] -translate-y-1/2 h-px border-t border-dashed border-border" />
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i}>
                <div className="relative h-full p-7 rounded-3xl border border-border bg-card hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <s.icon className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black font-outfit text-border/60">{s.step}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-bold font-outfit">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LIVE INTERFACE PREVIEW (recent mocks feel) ============ */}
      <section className="relative py-24 bg-secondary/50 border-y border-border overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 w-80 h-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="flex flex-col gap-5 max-w-lg">
              <span className="w-fit px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold tracking-wide">TRACK YOUR PROGRESS</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit leading-tight">
                Practice daily and watch your<br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> scores improve.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Switch between exam-mode mocks and relaxed learning mode, bookmark tough questions, then watch
                accuracy and speed climb month over month in your personal trend dashboard.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-primary" /> Learning Mode</span>
                <span className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-violet-500" /> Exam Mode</span>
                <span className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-rose-500" /> Streaks</span>
              </div>
            </div>
          </Reveal>

          {/* Mini trend sparklines */}
          <Reveal delay={1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testRows.map((r, i) => (
                <div key={r.title} className="p-5 rounded-3xl border border-border bg-card hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center"><r.icon className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-1 h-9">
                    {[35, 55, 40, 70, 60, 85, 75].map((h, hi) => (
                      <motion.div
                        key={hi}
                        initial={{ height: 4 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                        className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                      />
                    ))}
                  </div>
                  <div className={`mt-2 text-[11px] font-bold ${r.tone}`}>{r.stat}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ EXAM PLATFORMS ============ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">
          <Reveal className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">PREPARE FOR WHAT'S NEXT</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">One platform, every competitive exam</h2>
          </Reveal>

          <div className="flex flex-wrap justify-center gap-4">
            {platformNames.map((p, i) => (
              <Reveal key={p} delay={i}>
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card text-sm font-semibold hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 transition-all cursor-default">
                  {p}
                </span>
              </Reveal>
            ))}
          </div>

          {/* marquee of topics */}
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee gap-4">
              {marqueeTexts.map((t, i) => (
                <React.Fragment key={i}>
                  <span key={`a-${i}`} className="px-4 py-2 rounded-full border border-border bg-card text-xs text-muted-foreground whitespace-nowrap">{t}</span>
                  <span key={`b-${i}`} className="px-4 py-2 rounded-full border border-border bg-card text-xs text-muted-foreground whitespace-nowrap">{t}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="topper-reviews" className="relative py-24 bg-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-14 flex flex-col gap-4">
            <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">SUCCESS STORIES</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-outfit">From aspirant to candidate</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i}>
                <figure className="h-full p-7 rounded-3xl border border-border bg-card hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4">
                  <Quote className="w-7 h-7 text-primary/40" />
                  <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">{t.quote}</blockquote>
                  <figcaption className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent text-white text-xs font-bold flex items-center justify-center">{t.initials}</div>
                    <div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ANNOUNCEMENTS ============ */}
      {announcements.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4">
            <Reveal className="text-center max-w-2xl mx-auto flex flex-col gap-3">
              <span className="mx-auto w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">STAY UPDATED</span>
              <h2 className="text-3xl font-extrabold font-outfit">Latest from ExamOS</h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((a: any, i: number) => {
                const accent = a.accentColor || '#7c3aed';
                return (
                  <Reveal key={a._id} delay={i}>
                    <div className="h-full flex flex-col gap-1.5 p-5 rounded-2xl border bg-card hover:-translate-y-1 transition-all duration-300" style={{ borderColor: `${accent}4d` }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-outfit">{a.title}</span>
                        {a.type && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: `${accent}1a`, color: accent }}>{a.type}</span>}
                      </div>
                      {a.message && <p className="text-xs text-muted-foreground leading-relaxed">{a.message}</p>}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 sm:p-16 text-center shadow-2xl shadow-primary/20">
              <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-[100px] animate-glow" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/30 blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />
              <div className="relative flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-lg shadow-primary/30">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-outfit leading-tight">
                  Your exam day starts here.
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Join thousands of aspirants who treat every attempt like the real thing — and win because of the habit.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    href={loggedIn ? dashHref : '/login?mode=signup'}
                    className="px-8 py-4 rounded-2xl bg-primary text-white font-medium hover:bg-primary/95 transition-all flex items-center gap-2 group shadow-lg shadow-primary/30"
                  >
                    Start Preparing Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#features"
                    className="px-8 py-4 rounded-2xl border border-border bg-card hover:bg-muted transition-all font-medium"
                  >
                    See All Features
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="ExamOS" width={40} height={40} loading="lazy" className="w-10 h-10 rounded-xl shadow-md shadow-primary/20 object-cover" />
              <span className="font-bold text-xl font-outfit">ExamOS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              The Computer Based Test Operating System for aspirants who refuse to leave anything to chance.
            </p>
          </div>

          {[
            { h: 'Platform', links: [['Mock Tests', '/login'], ['Practice', '/practice'], ['Doubts', '/doubts'], ['Materials', '/materials']] },
            { h: 'Resources', links: [['Test Series', '/explore'], ['Blogs', '/blogs'], ['Leaderboards', '/leaderboard'], ['Revision', '/revision'], ['Plans', '/plans'], ['Partner Program', '/partner']] },
            { h: 'Company', links: [['Dashboard', loggedIn ? dashHref : '/login'], ['Sign In', '/login'], ['Create Account', '/login?mode=signup'], ['Announcements', '#']] },
          ].map((col) => (
            <div key={col.h} className="flex flex-col gap-3">
              <p className="text-sm font-bold font-outfit">{col.h}</p>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © 2026 ExamOS Inc. All rights reserved. Made for enterprise-scale CBT examination training.
          <div className="mt-2 space-x-4">
            <a href="/disclaimer" className="text-primary hover:text-primary/90 transition-colors text-[10px] mr-4">Disclaimer</a>
            <a href="/terms-and-conditions" className="text-primary hover:text-primary/90 transition-colors text-[10px] mr-4">Terms</a>
            <a href="/privacy-policy" className="text-primary hover:text-primary/90 transition-colors text-[10px] mr-4">Privacy</a>
            <a href="/refund-cancellation" className="text-primary hover:text-primary/90 transition-colors text-[10px]">Refund</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Data used by sections that need raw arrays
const prepCards = [
  {
    icon: BookOpen, title: 'Study Material',
    desc: 'Free PDFs, video lectures and topic-wise study material for every government exam.',
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  {
    icon: ClipboardList, title: 'Full Length Test Series',
    desc: 'Full-length CBT mock tests and previous year papers with the real exam interface.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: TrendingUp, title: 'Performance Analysis',
    desc: 'Speed, accuracy and rank reports that show your weak topics before the real exam.',
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Newspaper, title: 'Current Affairs',
    desc: 'Daily current affairs updates and quizzes for SSC, Banking, Railways and UPSC.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: NotebookPen, title: 'Curated Notes',
    desc: 'Short revision-ready notes curated by experts and toppers for fast preparation.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
];

const platformNames = [
  'SSC CGL', 'SSC CHSL', 'IBPS PO', 'IBPS Clerk', 'RRB NTPC', 'SBI PO', 'UPSC Prelims',
  'State PCS', 'Railways', 'Defence', 'LDC', 'Insurance',
];

const marqueeTexts = [
  'Number System', 'Data Interpretation', 'Current Affairs', 'Puzzle & Seating',
  'English Grammar', 'Banking Awareness', 'Geography', 'Polity', 'History',
  'Permutation', 'Probability', 'Reading Comprehension',
];
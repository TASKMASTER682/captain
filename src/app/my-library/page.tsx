'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/StudentLayout';
import { api } from '@/lib/api';
import { 
  BookMarked, Sparkles, Zap, BrainCircuit, Play, ChevronRight, 
  Target, AlertCircle, RotateCcw, AlertTriangle, Clock, Lock,
  PlusCircle, FileText, Calendar
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getRecMeta(type: string): { icon: LucideIcon; border: string; bg: string; iconBg: string; iconColor: string; badgeColor: string; badgeBg: string; linkColor: string; actionLabel: string } {
  switch (type) {
    case 'Topic Practice':
      return {
        icon: Target, border: 'border-rose-500/20', bg: 'bg-rose-500/[0.03]',
        iconBg: 'bg-rose-500/10', iconColor: 'text-rose-500',
        badgeColor: 'text-rose-500', badgeBg: 'bg-rose-500/10',
        linkColor: 'text-rose-500', actionLabel: 'Start Practice',
      };
    case 'Speed Boost':
      return {
        icon: Zap, border: 'border-amber-500/20', bg: 'bg-amber-500/[0.03]',
        iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500',
        badgeColor: 'text-amber-600', badgeBg: 'bg-amber-500/10',
        linkColor: 'text-amber-600', actionLabel: 'Improve Speed',
      };
    case 'Mock Test Focus':
      return {
        icon: AlertCircle, border: 'border-violet-500/20', bg: 'bg-violet-500/[0.03]',
        iconBg: 'bg-violet-500/10', iconColor: 'text-violet-500',
        badgeColor: 'text-violet-500', badgeBg: 'bg-violet-500/10',
        linkColor: 'text-violet-500', actionLabel: 'Review Results',
      };
    case 'General Revision':
      return {
        icon: RotateCcw, border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.03]',
        iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500',
        badgeColor: 'text-emerald-600', badgeBg: 'bg-emerald-500/10',
        linkColor: 'text-emerald-600', actionLabel: 'Start Revision',
      };
    default:
      return {
        icon: Sparkles, border: 'border-primary/20', bg: 'bg-primary/[0.03]',
        iconBg: 'bg-primary/10', iconColor: 'text-primary',
        badgeColor: 'text-primary', badgeBg: 'bg-primary/10',
        linkColor: 'text-primary', actionLabel: 'Get Started',
      };
  }
}

export default function MyLibraryPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'recommendations' | 'bookmarks' | 'practice'>('events');
  
  const [recs, setRecs] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [enrolledSeries, setEnrolledSeries] = useState<any[]>([]);

  // Practice form state
  const [practiceSubject, setPracticeSubject] = useState('');
  const [practiceCount, setPracticeCount] = useState(5);
  const [practiceTime, setPracticeTime] = useState(15);
  const [showPracticeForm, setShowPracticeForm] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [dailyUses, setDailyUses] = useState(0);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', color: 'lime' });
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        let activeUser = null;
        if (u) {
          activeUser = JSON.parse(u);
          setUser(activeUser);
        }

        const hasActiveSub =
          activeUser?.subscription?.status === 'active' &&
          (!activeUser?.subscription?.expiresAt || new Date(activeUser.subscription.expiresAt) > new Date());
        setHasActiveSub(hasActiveSub);
          
        const lockedAnalytics = hasActiveSub
          ? api.get('/my-analytics/weak-areas').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] });

        const [recRes, bookRes, subjRes, weakRes, enrollRes, eventsRes] = await Promise.all([
          api.get('/practice/recommendations').catch(() => ({ data: [] })),
          api.get('/bookmarks').catch(() => ({ data: [] })),
          api.get('/practice/subjects').catch((e) => { console.error('[practice subjects]', e); return { data: [] }; }),
          lockedAnalytics,
          api.get('/enrollments/me').catch(() => ({ data: [] })),
          api.get('/events').catch(() => ({ data: [] })),
        ]);
        
        setRecs(Array.isArray(recRes.data) ? recRes.data : []);
        setBookmarks(Array.isArray(bookRes.data) ? bookRes.data : []);
        setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setWeakAreas(Array.isArray(weakRes.data) ? weakRes.data : []);
        setEnrolledSeries(Array.isArray(enrollRes.data) ? enrollRes.data : []);

        // Track daily usage for free users (max 1 use per 24 hours)
        const isFreeUser = !hasActiveSub && (!enrollRes.data || enrollRes.data.length === 0);
        if (isFreeUser) {
          const usageData = JSON.parse(localStorage.getItem('infinitePracticeUsage') || '{"date":"","count":0}');
          const today = new Date().toDateString();
          if (usageData.date === today) {
            setDailyUses(usageData.count);
            if (usageData.count >= 1) setDailyLimitReached(true);
          } else {
            localStorage.setItem('infinitePracticeUsage', JSON.stringify({ date: today, count: 0 }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, []);

  const tabs = [
    { id: 'events', label: 'Upcoming Events', icon: Calendar },
    { id: 'recommendations', label: 'Smart Recommendations', icon: Sparkles },
    { id: 'bookmarks', label: 'Saved Questions', icon: BookMarked },
    { id: 'practice', label: 'Infinite Practice', icon: Zap },
  ];

  const handleCreateTest = async () => {
    if (!practiceSubject || creatingTest) return;

    const isFreeUser = !hasActiveSub && enrolledSeries.length === 0;
    const count = isFreeUser ? Math.min(practiceCount, 5) : practiceCount;

    // Check daily limit for free users
    if (isFreeUser && dailyLimitReached) return;

    setCreatingTest(true);
    try {
      // Find examId from enrolled series that has this subject
      const setupRes = await api.get('/custom-tests/setup');
      const exams = setupRes.data?.exams || [];

      // Try to find exam through the enrollment chain
      let examId = null;
      for (const enrollment of enrolledSeries) {
        const seriesId = enrollment.testSeriesId?._id || enrollment.testSeriesId;
        if (!seriesId) continue;
        try {
          const seriesRes = await api.get(`/test-series/${seriesId}`);
          const series = seriesRes.data;
          if (series?.examId?._id) {
            examId = series.examId._id;
            break;
          }
        } catch (_e) {}
      }

      // Fallback: use first available exam
      if (!examId && exams.length > 0) {
        examId = exams[0]._id;
      }

      if (!examId) {
        setCreatingTest(false);
        return;
      }

      const createRes = await api.post('/custom-tests/create', {
        examId,
        subject: practiceSubject,
        count,
        timeMinutes: practiceTime,
      });

      const testData = createRes.data;
      if (testData?.questions?.length > 0) {
        // Store config in localStorage and navigate to take page
        localStorage.setItem('custom-test-config', JSON.stringify({
          examId,
          examName: 'Quick Practice',
          subject: practiceSubject,
          questions: testData.questions,
          totalQuestions: testData.questions.length,
          timeMinutes: practiceTime,
        }));

        // Track usage for free users
        if (isFreeUser) {
          const usageData = JSON.parse(localStorage.getItem('infinitePracticeUsage') || '{"date":"","count":0}');
          const today = new Date().toDateString();
          const newCount = usageData.date === today ? usageData.count + 1 : 1;
          localStorage.setItem('infinitePracticeUsage', JSON.stringify({ date: today, count: newCount }));
          setDailyUses(newCount);
          if (newCount >= 1) setDailyLimitReached(true);
        }

        window.location.href = '/custom-test/take';
      }
    } catch (err) {
      console.error('Failed to create practice test', err);
    } finally {
      setCreatingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  const topicRecs = recs.filter(r => r.type === 'Topic Practice');
  const speedRecs = recs.filter(r => r.type === 'Speed Boost');
  const otherRecs = recs.filter(r => r.type !== 'Topic Practice' && r.type !== 'Speed Boost');

  return (
    <StudentLayout user={user}>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-foreground">My Library</h1>
            <p className="text-muted-foreground mt-1">Your personal collection and study hub</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scroll border-b border-border gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 border-b-2 font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon className="w-5 h-5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="py-4">

          {/* Upcoming Events Tab */}
          {activeTab === 'events' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Add Event button + header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-outfit text-foreground">Upcoming Events</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Plan your study schedule</p>
                </div>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-black text-xs font-bold hover:bg-lime-300 transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {showEventForm ? 'Cancel' : 'Add Event'}
                </button>
              </div>

              {/* Add Event Form */}
              {showEventForm && (
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="flex gap-1.5 items-center">
                    {['lime', 'sky', 'amber', 'rose', 'violet', 'emerald'].map((c) => (
                      <button key={c} onClick={() => setEventForm({ ...eventForm, color: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${eventForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c === 'lime' ? '#a3e635' : c === 'sky' ? '#38bdf8' : c === 'amber' ? '#fbbf24' : c === 'rose' ? '#fb7185' : c === 'violet' ? '#a78bfa' : '#34d399' }} />
                    ))}
                  </div>
                  <button onClick={async () => {
                      if (!eventForm.title || !eventForm.date) return;
                      setSavingEvent(true);
                      try { await api.post('/events', eventForm); const res = await api.get('/events'); setEvents(Array.isArray(res.data) ? res.data : []); setEventForm({ title: '', date: '', color: 'lime' }); setShowEventForm(false); } catch {}
                      setSavingEvent(false);
                    }} disabled={savingEvent || !eventForm.title || !eventForm.date}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0">
                    {savingEvent ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Calendar */}
                <div className="relative rounded-[2rem] overflow-hidden bg-card border border-border p-6 sm:p-8 w-full sm:w-[380px] sm:min-w-[380px]">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
                  <div className="absolute -top-16 -left-16 w-44 h-44 rounded-full bg-lime-400/20 blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-20 -right-16 w-48 h-48 rounded-full bg-lime-300/15 blur-[90px] pointer-events-none" />
                  <div className="relative z-10 mb-4">
                    <span className="text-[9px] font-bold text-lime-500 dark:text-lime-400/70 tracking-[0.2em] uppercase block mb-0.5">{new Date().getFullYear()}</span>
                    <h2 className="text-4xl sm:text-5xl font-black text-foreground font-outfit tracking-tight leading-none">{new Date().toLocaleString('default', { month: 'long' })}</h2>
                    <p className="text-[10px] text-lime-600 dark:text-lime-400/80 mt-1.5 font-medium">Stay consistent — one step closer every day</p>
                  </div>
                  <div className="relative z-10 rounded-xl border border-border p-4">
                    <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-lime-600 dark:text-lime-400 tracking-wider py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth();
                        const today = now.getDate();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const offset = firstDay === 0 ? 6 : firstDay - 1;
                        const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
                        const cells: React.ReactNode[] = [];
                        for (let i = 0; i < totalCells; i++) {
                          const dayNum = i - offset + 1;
                          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                          const isPast = isValid && dayNum < today;
                          const isToday = isValid && dayNum === today;
                          cells.push(
                            <div key={i} className="aspect-square flex items-center justify-center">
                              {isValid ? (
                                <div className={`w-full h-full flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all
                                  ${isToday ? 'border border-lime-500 dark:border-lime-400 text-lime-600 dark:text-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.15)]' : isPast ? 'text-muted-foreground/40' : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'}`}>
                                  {dayNum}
                                </div>
                              ) : <div />}
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Events List */}
                <div className="flex flex-col gap-2.5 sm:justify-center min-w-0">
                  {events.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-1">No upcoming events. Add one above!</div>
                  ) : events.slice(0, 8).map((e, i) => {
                    const d = new Date(e.date);
                    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    const dotColor = e.color === 'lime' ? '#a3e635' : e.color === 'sky' ? '#38bdf8' : e.color === 'amber' ? '#fbbf24' : e.color === 'rose' ? '#fb7185' : e.color === 'violet' ? '#a78bfa' : '#34d399';
                    return (
                      <div key={e._id || i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-muted/30 transition-all group relative">
                        <div className="flex flex-col items-center leading-none shrink-0">
                          <span className="text-lg font-black text-foreground font-outfit">{d.getDate()}</span>
                          <span className="text-[8px] font-bold tracking-wider" style={{ color: dotColor }}>{dayNames[d.getDay()]}</span>
                        </div>
                        <div className="h-8 w-px bg-border shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground truncate flex-1">{e.title}</span>
                        <button onClick={async () => { try { await api.delete(`/events/${e._id}`); setEvents((prev) => prev.filter((x) => x._id !== e._id)); } catch {} }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-rose-500 transition-all text-[10px]">✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          {activeTab === 'recommendations' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-md"></div>
                <div>
                  <h2 className="text-lg font-bold font-outfit text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> AI-Powered Study Path
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on your recent performance, our AI has curated these topics for you to focus on.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-1">
                  {recs.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-3xl text-center mt-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold font-outfit">Need More Data</h3>
                      <p className="text-muted-foreground max-w-sm mt-2 text-sm">
                        Attempt more tests for our AI engine to generate personalized study recommendations.
                      </p>
                      <Link href="/test-series" className="mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                        Explore Tests
                      </Link>
                    </div>
                  ) : (
                    <>
                      {topicRecs.length > 0 && (
                        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                              <Target className="w-4 h-4 text-rose-500" />
                            </div>
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10">Weak Topics</span>
                          </div>
                          <h4 className="font-bold text-sm leading-snug">Practice these topics to improve accuracy</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {topicRecs.map((rec, i) => {
                              const topicName = rec.title.replace('Improve Accuracy: ', '');
                              return (
                                <Link key={i} href={rec.action}
                                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-background hover:bg-rose-500/5 border border-border hover:border-rose-500/20 transition-all group"
                                >
                                  <span className="text-xs font-semibold group-hover:text-rose-500 transition-colors">{topicName}</span>
                                  <span className="text-[10px] text-rose-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {speedRecs.length > 0 && (
                        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10">Slow Topics</span>
                          </div>
                          <h4 className="font-bold text-sm leading-snug">Improve solving speed on these topics</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {speedRecs.map((rec, i) => {
                              const topicName = rec.title.replace('Optimize Timing: ', '');
                              return (
                                <Link key={i} href={rec.action}
                                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-background hover:bg-amber-500/5 border border-border hover:border-amber-500/20 transition-all group"
                                >
                                  <span className="text-xs font-semibold group-hover:text-amber-600 transition-colors">{topicName}</span>
                                  <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {otherRecs.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {otherRecs.map((rec, index) => {
                            const meta = getRecMeta(rec.type);
                            const Icon = meta.icon;
                            return (
                              <div key={index} className={`p-4 rounded-2xl border ${meta.border} ${meta.bg} flex flex-col gap-2.5`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg ${meta.iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-4 h-4 ${meta.iconColor}`} />
                                  </div>
                                  <span className={`text-[10px] font-bold ${meta.badgeColor} uppercase tracking-wider px-2 py-0.5 rounded ${meta.badgeBg}`}>{rec.type}</span>
                                </div>
                                <h4 className="font-bold text-sm leading-snug">{rec.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                                <Link href={rec.action} className={`text-xs font-bold ${meta.linkColor} hover:underline mt-0.5 inline-flex items-center gap-1`}>
                                  {meta.actionLabel} →
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Weak Areas */}
              {weakAreas.length > 0 && (
                <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 shadow-sm mt-4">
                  <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Areas Needing Attention
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {weakAreas.map((area: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex justify-between items-center text-xs">
                        <span className="font-bold">{area.topic || area.subject}</span>
                        <span className="text-rose-500 font-mono font-bold">{Math.round(area.accuracy)}% Acc</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bookmarks */}
          {activeTab === 'bookmarks' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-indigo-500" /> Saved For Later
                </h2>
              </div>
              
              {bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {bookmarks.map((bm: any, idx: number) => {
                    const q = bm.questionId || {};
                    return (
                      <Link 
                        key={idx}
                        href={`/practice?questionIds=${encodeURIComponent(q._id || '')}`}
                        className="p-4 rounded-xl border border-border bg-card flex items-start gap-4 hover:border-primary/40 hover:bg-muted/50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <BookMarked className="w-5 h-5 text-indigo-500 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div dangerouslySetInnerHTML={{ __html: q.body || q.content || 'Question content' }} className="text-sm font-medium line-clamp-2" />
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-muted-foreground inline-block px-2 py-1 bg-muted rounded-md uppercase">
                              {q.subject?.name || q.subject || 'Subject'}
                            </span>
                            {(q.topic?.name || q.topic) && (
                              <span className="text-[10px] font-bold text-muted-foreground inline-block px-2 py-1 bg-muted rounded-md uppercase">
                                {q.topic?.name || q.topic}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center">
                          <Play className="w-5 h-5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-3xl text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <BookMarked className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit">No Saved Questions</h3>
                  <p className="text-muted-foreground max-w-sm mt-2 text-sm">
                    Questions you bookmark during practice or tests will appear here for quick revision.
                  </p>
                  <Link href="/practice" className="mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                    Go to Practice
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Infinite Practice */}
          {activeTab === 'practice' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Premium Banner */}
              <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold font-outfit">Create Test</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Generate a custom practice test. Choose subject, question count, and time limit.
                  </p>
                </div>
                {!hasActiveSub && enrolledSeries.length === 0 && (
                  <div className="text-[10px] text-amber-600 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-lg">
                    Free: 5 questions, 1 test/day
                  </div>
                )}
              </div>

              {/* Create Test Form */}
              {dailyLimitReached ? (
                <div className="p-8 text-center border border-amber-500/20 rounded-3xl bg-amber-500/5">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-bold text-sm mb-1">Daily Limit Reached</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Free users can create 1 test per day. Come back tomorrow or upgrade for unlimited access.
                  </p>
                  <Link href="/plans" className="px-5 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all inline-flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Upgrade Now
                  </Link>
                </div>
              ) : !showPracticeForm ? (
                <button
                  onClick={() => setShowPracticeForm(true)}
                  className="p-6 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <PlusCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm font-outfit">Create New Test</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select subject, choose question count and time limit
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                </button>
              ) : (
                <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm font-outfit">Test Configuration</h3>
                    <button onClick={() => setShowPracticeForm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Subject *</label>
                    <select 
                      value={practiceSubject}
                      onChange={(e) => setPracticeSubject(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question Count */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Number of Questions</label>
                    <div className="flex items-center gap-2">
                      {[5, 10, 15, 20].map((n) => {
                        const isLocked = n > 5 && !hasActiveSub && enrolledSeries.length === 0;
                        return (
                          <button
                            key={n}
                            onClick={() => !isLocked && setPracticeCount(n)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all relative ${
                              practiceCount === n
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : isLocked
                                ? 'bg-secondary text-muted-foreground/50 cursor-not-allowed'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {n}
                            {isLocked && <Lock className="w-3 h-3 absolute top-1 right-1 text-amber-500" />}
                          </button>
                        );
                      })}
                    </div>
                    {!hasActiveSub && enrolledSeries.length === 0 && (
                      <p className="text-[10px] text-amber-600 font-semibold">
                        Free plan: max 5 questions. <Link href="/plans" className="underline">Upgrade</Link> for more.
                      </p>
                    )}
                  </div>

                  {/* Time Limit */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Time Limit</label>
                    <div className="flex items-center gap-2">
                      {[10, 15, 20, 30].map((t) => (
                        <button
                          key={t}
                          onClick={() => setPracticeTime(t)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                            practiceTime === t
                              ? 'bg-primary text-white shadow-md shadow-primary/20'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {t}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily usage indicator for free users */}
                  {!hasActiveSub && enrolledSeries.length === 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Daily uses remaining: <strong className="text-foreground">{1 - dailyUses}</strong> / 1</span>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleCreateTest}
                    disabled={!practiceSubject || creatingTest}
                    className="py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {creatingTest ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating Test...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Start Test ({practiceCount} Questions, {practiceTime}m)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl font-black text-primary mb-1">Instant</div>
                  <p className="text-xs text-muted-foreground">See answers and explanations immediately after submitting.</p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl font-black text-primary mb-1">Adaptive</div>
                  <p className="text-xs text-muted-foreground">Questions from your enrolled test series question bank.</p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl font-black text-primary mb-1">Custom</div>
                  <p className="text-xs text-muted-foreground">Choose subject, question count, and time limit.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </StudentLayout>
  );
}

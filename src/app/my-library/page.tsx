'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/StudentLayout';
import { api } from '@/lib/api';
import { 
  BookMarked, Sparkles, Zap, BrainCircuit, Play, ChevronRight, 
  Target, AlertCircle, RotateCcw, AlertTriangle 
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
  const [activeTab, setActiveTab] = useState<'recommendations' | 'bookmarks' | 'practice'>('recommendations');
  
  const [recs, setRecs] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
          
        const lockedAnalytics = hasActiveSub
          ? api.get('/my-analytics/weak-areas').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] });

        const [recRes, bookRes, subjRes, weakRes] = await Promise.all([
          api.get('/practice/recommendations').catch(() => ({ data: [] })),
          api.get('/bookmarks').catch(() => ({ data: [] })),
          api.get('/practice/subjects').catch(() => ({ data: [] })),
          lockedAnalytics
        ]);
        
        setRecs(Array.isArray(recRes.data) ? recRes.data : []);
        setBookmarks(Array.isArray(bookRes.data) ? bookRes.data : []);
        setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
        setWeakAreas(Array.isArray(weakRes.data) ? weakRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, []);

  const tabs = [
    { id: 'recommendations', label: 'Smart Recommendations', icon: Sparkles },
    { id: 'bookmarks', label: 'Saved Questions', icon: BookMarked },
    { id: 'practice', label: 'Infinite Practice', icon: Zap },
  ];

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
                        href={`/practice?subject=${encodeURIComponent(q.subject || '')}&topic=${encodeURIComponent(q.topic || '')}`}
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
               <div className="p-8 rounded-3xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-card flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700"></div>
                  
                  <div className="flex-1 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold mb-4">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" /> Premium Feature
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black font-outfit mb-3">Infinite Practice Mode</h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-lg">
                      Enter a never-ending stream of questions tailored to your exact weaknesses. Perfect for quick sessions on the go.
                    </p>
                    
                    {subjects.length === 0 ? (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-rose-500 mb-3">Enroll in a test series to unlock practice subjects.</p>
                        <Link href="/test-series" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 inline-flex items-center gap-2">
                          Browse Test Series
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Select Subject to Start:</p>
                        <div className="flex flex-wrap gap-3">
                          {subjects.map((s: string) => (
                            <Link key={s} href={`/practice?subject=${encodeURIComponent(s)}`}
                              className="px-5 py-2.5 rounded-xl border border-amber-500/30 bg-background hover:bg-amber-500 hover:text-white hover:border-amber-500 text-sm font-semibold transition-all shadow-sm"
                            >
                              {s}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full md:w-1/3 relative z-10 flex justify-center hidden md:flex">
                    <div className="w-48 h-48 relative">
                      <div className="absolute inset-0 border-[8px] border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                      <div className="absolute inset-2 border-[4px] border-amber-500/40 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-16 h-16 text-amber-500 fill-amber-500 drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="p-5 rounded-2xl border border-border bg-card text-center">
                    <div className="text-2xl font-black text-amber-500 mb-1">Adaptive</div>
                    <p className="text-xs text-muted-foreground">Questions adjust to your current skill level in real-time.</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-border bg-card text-center">
                    <div className="text-2xl font-black text-amber-500 mb-1">Micro-Learning</div>
                    <p className="text-xs text-muted-foreground">Practice for 5 minutes or 5 hours. It's up to you.</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-border bg-card text-center">
                    <div className="text-2xl font-black text-amber-500 mb-1">Rewards</div>
                    <p className="text-xs text-muted-foreground">Earn streak multipliers and XP points faster.</p>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </StudentLayout>
  );
}

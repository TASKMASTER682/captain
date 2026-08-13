'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { Crown, Plus, Edit3, Trash2, ArrowLeft, Save, X, Target, Search, Check, Pin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Every premium pack ships with these perks automatically (free tier restricts them).
const PREMIUM_PERKS = [
  'Unlimited full-length mock tests',
  'Old papers with solutions',
  'Detailed performance analytics & reports',
  'Weekly Sunday Free Mock',
  'Priority doubt resolution',
  'Ad-free experience',
];

const COVERAGE_OPTIONS = [
  { type: 'all', label: 'All test series', hint: 'Every active series under the selected exams (live follow)' },
  { type: 'fraction', label: 'Half (50%)', hint: '~50% of series auto-picked (live follow)' },
  { type: 'fraction25', label: '25%', hint: '~25% of series auto-picked (live follow)' },
  { type: 'random', label: 'Random', hint: 'Random ~50% (live follow)' },
  { type: 'manual', label: 'Manual pick', hint: 'Hand-pick exactly which series are included' },
];

const toId = (x: any) => (typeof x === 'string' ? x : x?._id);

// Mirrors the backend deterministic hash so admins see which series the random
// fraction picks today (live follow).
const stableHash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

export default function PlansManagement() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, billingCycle: 'monthly', active: true, popular: false });

  // Pack scope
  const [durationMonths, setDurationMonths] = useState(1);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [examQuery, setExamQuery] = useState('');
  const [coverageType, setCoverageType] = useState('all');
  // manual mode -> selectedSeries; fraction/random mode -> pinnedSeries (override adds)
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [pinnedSeries, setPinnedSeries] = useState<string[]>([]);
  const [seriesQuery, setSeriesQuery] = useState('');

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadReference();
    loadPlans();
  }, [router]);

  const loadReference = async () => {
    try {
      const [agRes, exRes, seRes] = await Promise.all([
        api.get('/agencies').catch(() => ({ data: [] })),
        api.get('/exams').catch(() => ({ data: [] })),
        api.get('/test-series?active=true').catch(() => ({ data: [] })),
      ]);
      setAgencies(Array.isArray(agRes.data) ? agRes.data : []);
      setExams(Array.isArray(exRes.data) ? exRes.data : []);
      setAllSeries(Array.isArray(seRes.data) ? seRes.data : []);
    } catch (err) { console.error(err); }
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, billingCycle: 'monthly', active: true, popular: false });
    setDurationMonths(1);
    setSelectedAgencies([]);
    setSelectedExams([]);
    setExamQuery('');
    setCoverageType('all');
    setSelectedSeries([]);
    setPinnedSeries([]);
    setSeriesQuery('');
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', price: p.price || 0,
      billingCycle: p.billingCycle || 'monthly',
      active: p.active !== false, popular: !!p.popular,
    });
    setSelectedAgencies((p.agencyIds || []).map(toId).filter(Boolean));
    setSelectedExams((p.examIds || []).map(toId).filter(Boolean));
    const cov = p.coverage || {};
    const covType = cov.type || 'all';
    setCoverageType(covType === 'fraction' ? (Number(cov.fraction) === 0.25 ? 'fraction25' : 'fraction') : covType);
    setSelectedSeries(covType === 'manual' ? (cov.seriesIds || []).map(toId).filter(Boolean) : []);
    setPinnedSeries(covType === 'fraction' || covType === 'random' ? (cov.seriesIds || []).map(toId).filter(Boolean) : []);
    setDurationMonths(p.durationMonths > 0 ? p.durationMonths : (p.durationDays > 0 ? Math.round(p.durationDays / 30) : 0));
    setShowForm(true);
  };

  const toggleAgency = (id: string) => {
    setSelectedAgencies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExam = (id: string) => {
    setSelectedExams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSeries = (id: string) => {
    setSelectedSeries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const togglePin = (id: string) => {
    setPinnedSeries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const examAgencyId = (e: any) => toId(e.agencyId);
  const seriesExamId = (s: any) => toId(s.examId);

  const visibleExams = exams.filter((e: any) =>
    (selectedAgencies.length === 0 || selectedAgencies.includes(examAgencyId(e))) &&
    (!examQuery || e.name.toLowerCase().includes(examQuery.toLowerCase()))
  );

  const visibleSeries = allSeries.filter((s: any) =>
    selectedExams.length > 0 && selectedExams.includes(seriesExamId(s)) &&
    (!seriesQuery || s.title.toLowerCase().includes(seriesQuery.toLowerCase()))
  );

  const covType = coverageType === 'fraction25' ? 'fraction' : coverageType;
  const coverageFraction = coverageType === 'fraction25' ? 0.25 : 0.5;
  const isRandomMode = covType === 'fraction' || covType === 'random';

  const isAutoIncluded = (id: string) => {
    if (!isRandomMode) return false;
    const f = coverageFraction;
    if (f >= 1) return true;
    return stableHash(id) % 100 < f * 100;
  };

  const handleSave = async () => {
    try {
      const months = Number(durationMonths) || 0;
      const payload = {
        ...form,
        price: Number(form.price),
        durationDays: months > 0 ? months * 30 : 0,
        durationMonths: months,
        agencyIds: selectedAgencies,
        examIds: selectedExams,
        coverage: {
          type: covType,
          fraction: isRandomMode ? coverageFraction : 1,
          ...(covType === 'manual' ? { seriesIds: selectedSeries } : {}),
          ...(isRandomMode && pinnedSeries.length > 0 ? { seriesIds: pinnedSeries } : {}),
        },
      };
      if (editing) {
        await api.put(`/plans/${editing._id}`, payload);
      } else {
        await api.post('/plans', payload);
      }
      setShowForm(false);
      await loadPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try { await api.delete(`/plans/${id}`); await loadPlans(); }
    catch (err: any) { alert(err.message); }
  };

  const cycleLabel: any = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', lifetime: 'Lifetime' };

  const coverageLabel = (p: any) => {
    const cov = p.coverage || {};
    const map: any = {
      all: 'All test series (live)',
      manual: `Manual · ${(cov.seriesIds || []).length} series`,
      fraction: `${Math.round((cov.fraction || 1) * 100)}% of series (live)`,
      random: `Random ${Math.round((cov.fraction || 1) * 100)}% (live)`,
    };
    const base = map[cov.type] || 'All test series (live)';
    const extras = (cov.seriesIds || []).length;
    return cov.type === 'fraction' || cov.type === 'random' ? `${base}${extras > 0 ? ` + ${extras} pinned` : ''}` : base;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Crown className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-lg font-outfit">Plans & Pricing</h1>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Pack
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Crown className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No plans yet. Create your first subscription pack.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(p => (
              <div key={p._id} className={`p-6 rounded-3xl border bg-card flex flex-col gap-3 transition-all ${p.popular ? 'border-amber-500/40 ring-2 ring-amber-500/10' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold font-outfit">{p.name}</span>
                  {p.popular && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">Popular</span>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-outfit">₹{p.price}</span>
                  <span className="text-xs text-muted-foreground">/ {cycleLabel[p.billingCycle] || p.billingCycle}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">{p.durationMonths > 0 ? `${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}` : 'Lifetime'}</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500">{coverageLabel(p)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.examIds?.length > 0 ? p.examIds.map((e: any) => (
                    <span key={toId(e)} className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">{e.name || e}</span>
                  )) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-400">General · all users</span>
                  )}
                </div>
                {p.agencyIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.agencyIds.map((a: any) => (
                      <span key={toId(a)} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Agency: {a.name || a}</span>
                    ))}
                  </div>
                )}
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <div className="flex flex-col gap-1.5">
                  {(p.features || []).map((f: string, i: number) => <span key={i} className="text-xs flex items-center gap-1.5"><span className="text-emerald-500">✓</span>{f}</span>)}
                </div>
                <div className={`mt-auto text-[10px] font-semibold ${p.active ? 'text-emerald-500' : 'text-rose-500'}`}>{p.active ? 'Active' : 'Inactive'}</div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleDelete(p._id)} className="p-2.5 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-lg p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Pack' : 'New Pack'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Pack Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. JKSSB FAA 3-Month Pack" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
              </div>

              {/* ---- Pack scope: Agency ---- */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-amber-500" /> Pack Scope — Agency</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedAgencies([])} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${selectedAgencies.length === 0 ? 'bg-amber-600 text-white' : 'bg-background border border-border text-muted-foreground'}`}>All</button>
                  {agencies.map(a => (
                    <button key={toId(a)} onClick={() => toggleAgency(toId(a))} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${selectedAgencies.includes(toId(a)) ? 'bg-amber-600 text-white' : 'bg-background border border-border text-muted-foreground'}`}>{a.name}</button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">All = available to users of any agency. Select one below to target only its users.</p>
              </div>

              {/* ---- Pack scope: Exams ---- */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl border border-violet-500/20 bg-violet-500/5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-violet-500" /> Pack Scope — Exams</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={examQuery} onChange={e => setExamQuery(e.target.value)} placeholder="Search exam..." className="w-full px-8 py-2.5 rounded-xl border border-border bg-background text-xs" />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {visibleExams.map(e => (
                    <button key={toId(e)} onClick={() => toggleExam(toId(e))} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${selectedExams.includes(toId(e)) ? 'bg-violet-600 text-white' : 'bg-background border border-border text-muted-foreground'}`}>{e.name}</button>
                  ))}
                  {visibleExams.length === 0 && <span className="text-[10px] text-muted-foreground">Select an agency first or search by name</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">{selectedExams.length === 0 ? 'No exam selected = General pack (visible to all users).' : `${selectedExams.length} exam(s) selected. Shown to users whose exam preferences match.`}</p>
              </div>

              {/* ---- Coverage ---- */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <label className="text-xs font-semibold text-muted-foreground">Kitni Test Series is pack me?</label>
                <div className="flex flex-wrap gap-1.5">
                  {COVERAGE_OPTIONS.map(o => (
                    <button key={o.type} onClick={() => setCoverageType(o.type)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${coverageType === o.type ? 'bg-emerald-600 text-white' : 'bg-background border border-border text-muted-foreground'}`}>{o.label}</button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{COVERAGE_OPTIONS.find(o => o.type === coverageType)?.hint}</p>

                {/* Series management: manual mode OR pin-override on random/fraction */}
                {selectedExams.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" value={seriesQuery} onChange={e => setSeriesQuery(e.target.value)} placeholder="Search series..." className="w-full px-8 py-2.5 rounded-xl border border-border bg-background text-xs" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{covType === 'manual'
                        ? `${selectedSeries.length} series selected`
                        : isRandomMode
                          ? `Auto-included series + ${pinnedSeries.length} manually pinned`
                          : 'Saare selected exams ki series include'}</span>
                      {(covType === 'manual' || isRandomMode) && selectedSeries.length + pinnedSeries.length > 0 && (
                        <button onClick={() => { setSelectedSeries([]); setPinnedSeries([]); }} className="text-rose-500 font-bold hover:underline">Clear all</button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {visibleSeries.map(s => {
                        const id = toId(s);
                        if (covType === 'manual') {
                          const on = selectedSeries.includes(id);
                          return (
                            <button key={id} onClick={() => toggleSeries(id)} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${on ? 'bg-emerald-600 text-white' : 'bg-background border border-border text-muted-foreground'}`}>
                              <span className="text-left">{s.title}</span>
                              {on ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                            </button>
                          );
                        }
                        if (isRandomMode) {
                          const auto = isAutoIncluded(id);
                          const pinned = pinnedSeries.includes(id);
                          return (
                            <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-background border border-border">
                              <span className="text-xs font-semibold">{s.title}</span>
                              {auto && !pinned ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold">Auto ✓</span>
                              ) : pinned ? (
                                <button onClick={() => togglePin(id)} className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</button>
                              ) : (
                                <button onClick={() => togglePin(id)} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-bold flex items-center gap-1"><Pin className="w-3 h-3" /> Pin</button>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}
                      {visibleSeries.length === 0 && <span className="text-[10px] text-muted-foreground">No series found</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={e => setForm({...form, billingCycle: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Pass duration (months, 0 = lifetime)</label>
                  <input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
                <label className="flex items-center gap-2 pt-7 text-xs font-semibold text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                  Popular badge
                </label>
              </div>

              {/* Premium perks — automatic on every pack */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <label className="text-xs font-semibold text-muted-foreground">Included automatically in every premium pack (restricted on the free tier):</label>
                <div className="flex flex-col gap-1">
                  {PREMIUM_PERKS.map(f => (
                    <span key={f} className="text-[11px] flex items-center gap-1.5 text-muted-foreground"><span className="text-emerald-500"><Check className="w-3 h-3" /></span>{f}</span>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                Active
              </label>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Pack</button>
          </div>
        </div>
      )}
    </div>
  );
}

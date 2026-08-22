'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getAuthUser, setAuthToken } from '@/lib/api';
import { EXPLORE_AGENCY_STORAGE_KEY, EXPLORE_AGENCY_CHANGED_EVENT } from '@/components/AgencyContext';
import {
  ArrowLeft, Building2, GraduationCap, Search, Check, X, Save,
  Loader2, ChevronDown, CheckCircle2, AlertCircle, MousePointerClick,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Reusable searchable multi-select with reliable open/close/select behaviour:
// - click the field or start typing -> opens
// - click outside / press Escape / click the chevron -> closes
// - picked options stay listed as removable chips so selection is always visible
// ---------------------------------------------------------------------------

interface Option { _id: string; name?: string; code?: string }
type Accent = { soft: string; solid: string; ring: string };

function MultiSelect({
  icon: Icon, stepLabel, title, hint, items, chipPool, selectedIds, onToggle,
  onClearAll, searchPlaceholder, emptyState, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  stepLabel: string;
  title: string;
  hint: string;
  items: Option[];
  chipPool: Option[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClearAll: () => void;
  searchPlaceholder: string;
  emptyState: React.ReactNode;
  accent: Accent;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape — the missing piece in the old UI
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const s = query.toLowerCase();
    return items.filter((o) => o.name?.toLowerCase().includes(s) || o.code?.toLowerCase().includes(s));
  }, [items, query]);

  const chipItems = useMemo(
    () => chipPool.filter((o) => selectedIds.includes(o._id)),
    [chipPool, selectedIds]
  );

  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`w-9 h-9 rounded-xl ${accent.soft} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4.5 h-4.5 w-[18px] h-[18px]`} />
          </span>
          <div>
            <h3 className="text-sm font-bold font-outfit flex items-center gap-2">
              {title}
              {selectedIds.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md ${accent.soft} text-[10px] font-bold`}>
                  {selectedIds.length} selected
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          </div>
        </div>
        <span className="px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-bold shrink-0">{stepLabel}</span>
      </div>

      {/* Trigger + dropdown */}
      <div ref={rootRef} className="relative">
        <div
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.tagName !== 'INPUT') setOpen((v) => !v); // click field = toggle
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-background cursor-pointer transition-colors ${open ? 'border-primary/60' : 'border-border hover:border-border/80'}`}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-xs focus:outline-none min-w-0"
          />
          {selectedIds.length > 0 && !open && (
            <span className={`text-[10px] font-bold ${accent.ring}`}>{selectedIds.length}</span>
          )}
          <button
            type="button"
            aria-label={open ? 'Close list' : 'Open list'}
            className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
          >
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              emptyState
            ) : filtered.map((o) => {
              const sel = selectedIds.includes(o._id);
              return (
                <button
                  key={o._id}
                  type="button"
                  onClick={() => { onToggle(o._id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs text-left transition-colors ${sel ? `${accent.soft} font-semibold` : 'hover:bg-muted'}`}
                >
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${sel ? `${accent.solid} border-transparent` : 'border-border'}`}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="flex-1 truncate">{o.name}</span>
                  {o.code && <span className="text-muted-foreground font-mono text-[10px]">{o.code}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected chips — always visible, even with dropdown closed */}
      {chipItems.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chipItems.map((o) => (
            <span key={o._id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${accent.soft} text-[11px] font-semibold border border-transparent`}>
              {o.name}
              <button type="button" onClick={() => onToggle(o._id)} className="hover:text-rose-500 transition-colors" aria-label={`Remove ${o.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={onClearAll} className="px-2 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
            Clear all
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5" /> Nothing selected yet — pick from the list above.
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [initial, setInitial] = useState<{ agencies: string[]; exams: string[] }>({ agencies: [], exams: [] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) { router.push('/login'); return; }
    setUser(activeUser);
    const a = activeUser.agencies || [];
    const e = activeUser.exams || [];
    setSelectedAgencyIds(a);
    setSelectedExamIds(e);
    setInitial({ agencies: [...a], exams: [...e] });

    Promise.all([
      api.get('/agencies').catch(() => ({ data: [] })),
      api.get('/exams').catch(() => ({ data: [] })),
    ]).then(([aRes, eRes]) => {
      setAgencies(Array.isArray(aRes.data) ? aRes.data : []);
      setAllExams(Array.isArray(eRes.data) ? eRes.data : []);
    });
  }, [router]);

  // Exams are scoped to the chosen agencies
  const examsForAgencies = useMemo(() => {
    if (selectedAgencyIds.length === 0) return [];
    return allExams.filter((e: any) => {
      const aId = e.agencyId?._id || e.agencyId;
      return selectedAgencyIds.includes(aId);
    });
  }, [allExams, selectedAgencyIds]);

  const toggleAgency = (id: string) => {
    setSelectedAgencyIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Drop exams whose agency was deselected — avoids stale hidden selections
      setSelectedExamIds((exPrev) =>
        exPrev.filter((exId) => {
          const ex = allExams.find((x: any) => x._id === exId);
          if (!ex) return true;
          const aId = ex.agencyId?._id || ex.agencyId;
          return next.includes(aId);
        })
      );
      return next;
    });
    setSavedOnce(false);
    setSaveError('');
  };

  const toggleExam = (id: string) => {
    setSelectedExamIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setSavedOnce(false);
    setSaveError('');
  };

  const dirty =
    JSON.stringify([...selectedAgencyIds].sort()) !== JSON.stringify([...initial.agencies].sort()) ||
    JSON.stringify([...selectedExamIds].sort()) !== JSON.stringify([...initial.exams].sort());

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.patch('/auth/preferences', { agencies: selectedAgencyIds, exams: selectedExamIds });
      const updatedUser = res.data?.user || { ...user, agencies: selectedAgencyIds, exams: selectedExamIds };
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      setAuthToken(token, updatedUser);

      // Preferences just changed — drop any now-stale explore-agency override
      // so the dashboard reflects the new choices instead of an outdated pick
      // (e.g. an agency that was just removed keeps showing up otherwise).
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(EXPLORE_AGENCY_STORAGE_KEY) : null;
        if (stored && !selectedAgencyIds.includes(stored)) {
          localStorage.removeItem(EXPLORE_AGENCY_STORAGE_KEY);
          window.dispatchEvent(new CustomEvent(EXPLORE_AGENCY_CHANGED_EVENT, { detail: null }));
        }
      } catch {}

      setInitial({ agencies: [...selectedAgencyIds], exams: [...selectedExamIds] });
      setSavedOnce(true);
    } catch (err) {
      console.error(err);
      setSaveError('Could not save preferences. Please try again.');
    }
    setSaving(false);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-4 sm:px-6 py-3.5 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary-foreground hover:text-secondary transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-bold text-base sm:text-lg font-outfit leading-tight">Profile &amp; Preferences</h1>
          <p className="text-[11px] text-muted-foreground">Personalise your exam preparation</p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6 pb-32 flex flex-col gap-5">

        {/* Profile summary */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm">
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/25">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base truncate">{user.name}</h2>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            {user.role && (
              <span className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-bold shrink-0">{user.role}</span>
            )}
          </div>
        </div>

        {/* Step 1 — Agencies */}
        <MultiSelect
          icon={Building2}
          stepLabel="STEP 1"
          title="Your Agencies"
          hint="Choose the exam bodies you're preparing for — SSC, Banking, Railways and more."
          items={agencies}
          chipPool={agencies}
          selectedIds={selectedAgencyIds}
          onToggle={toggleAgency}
          onClearAll={() => { setSelectedAgencyIds([]); setSelectedExamIds([]); setSavedOnce(false); }}
          searchPlaceholder="Search agencies by name or code..."
          emptyState={<div className="px-3 py-4 text-xs text-muted-foreground text-center">No agencies match your search.</div>}
          accent={{ soft: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', solid: 'bg-cyan-500', ring: 'text-cyan-600 dark:text-cyan-400' }}
        />

        {/* Step 2 — Exams */}
        <MultiSelect
          icon={GraduationCap}
          stepLabel="STEP 2"
          title="Your Exams"
          hint="Pick specific exams under your agencies. Test series will be matched to these."
          items={examsForAgencies}
          chipPool={allExams}
          selectedIds={selectedExamIds}
          onToggle={toggleExam}
          onClearAll={() => { setSelectedExamIds([]); setSavedOnce(false); }}
          searchPlaceholder={selectedAgencyIds.length > 0 ? 'Search exams...' : 'Select an agency first'}
          emptyState={
            selectedAgencyIds.length === 0 ? (
              <div className="px-3 py-5 flex flex-col items-center gap-2 text-center">
                <GraduationCap className="w-5 h-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Pick at least one agency in <span className="font-bold">Step 1</span> — its exams will appear here.</p>
              </div>
            ) : (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No exams found for your selection.</div>
            )
          }
          accent={{ soft: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', solid: 'bg-violet-500', ring: 'text-violet-600 dark:text-violet-400' }}
        />

        {/* Info strip */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-[11px] text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          You can change these anytime. Your dashboard, recommendations and test series adapt instantly after saving.
        </div>
      </main>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-40 px-4 sm:px-6 pb-4 sm:pb-6 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-colors flex items-center gap-3 ${dirty ? 'border-primary/30 bg-card/95' : 'border-border bg-card/80'}`}>
            <div className="flex-1 min-w-0 pl-1">
              {saveError ? (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}</p>
              ) : savedOnce && !dirty ? (
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Preferences saved!
                  <Link href="/dashboard" className="ml-1 underline underline-offset-2 hover:text-emerald-400">Go to Dashboard →</Link>
                </p>
              ) : dirty ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{selectedAgencyIds.length} agenc{selectedAgencyIds.length === 1 ? 'y' : 'ies'}</span>, {' '}
                  <span className="font-bold text-foreground">{selectedExamIds.length} exam{selectedExamIds.length === 1 ? '' : 's'}</span> selected — save to apply.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No changes yet.</p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

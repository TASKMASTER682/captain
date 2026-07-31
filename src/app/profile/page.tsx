'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getAuthUser, setAuthToken } from '@/lib/api';
import { ArrowLeft, Building2, GraduationCap, Search, Check, X, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [agencySearch, setAgencySearch] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) { router.push('/login'); return; }
    setUser(activeUser);
    setSelectedAgencyIds(activeUser.agencies || []);
    setSelectedExamIds(activeUser.exams || []);

    Promise.all([
      api.get('/agencies').catch(() => ({ data: [] })),
      api.get('/exams').catch(() => ({ data: [] })),
    ]).then(([aRes, eRes]) => {
      setAgencies(Array.isArray(aRes.data) ? aRes.data : []);
      setAllExams(Array.isArray(eRes.data) ? eRes.data : []);
    });
  }, [router]);

  const filteredAgencies = useMemo(() => {
    if (!agencySearch.trim()) return agencies;
    const s = agencySearch.toLowerCase();
    return agencies.filter((a: any) => a.name?.toLowerCase().includes(s) || a.code?.toLowerCase().includes(s));
  }, [agencies, agencySearch]);

  const filteredExams = useMemo(() => {
    let pool = allExams;
    if (selectedAgencyIds.length > 0) {
      pool = allExams.filter((e: any) => {
        const aId = e.agencyId?._id || e.agencyId;
        return selectedAgencyIds.includes(aId);
      });
    }
    if (!examSearch.trim()) return pool;
    const s = examSearch.toLowerCase();
    return pool.filter((e: any) => e.name?.toLowerCase().includes(s) || e.code?.toLowerCase().includes(s));
  }, [allExams, selectedAgencyIds, examSearch]);

  const toggleAgency = (id: string) => {
    setSelectedAgencyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setSaved(false);
  };

  const toggleExam = (id: string) => {
    setSelectedExamIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/preferences', { agencies: selectedAgencyIds, exams: selectedExamIds });
      // Update local storage user
      const updatedUser = res.data?.user || { ...user, agencies: selectedAgencyIds, exams: selectedExamIds };
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      setAuthToken(token, updatedUser);
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const selectedAgencyObjects = agencies.filter((a: any) => selectedAgencyIds.includes(a._id));

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="font-bold text-lg font-outfit">Profile & Preferences</h1>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* User Info */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">{user.name?.[0] || '?'}</div>
            <div>
              <h2 className="font-bold text-base">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Agencies */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold font-outfit flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-500" /> Your Agencies</h3>
          <p className="text-xs text-muted-foreground">Select the agencies you want to prepare for.</p>

          {/* Selected tags */}
          {selectedAgencyObjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedAgencyObjects.map((a: any) => (
                <span key={a._id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 text-[11px] font-semibold border border-cyan-500/10">
                  {a.name}
                  <button onClick={() => toggleAgency(a._id)} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background cursor-pointer" onClick={() => setAgencyDropdownOpen(!agencyDropdownOpen)}>
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search agencies..." value={agencySearch} onClick={(e) => e.stopPropagation()} onChange={(e) => { setAgencySearch(e.target.value); setAgencyDropdownOpen(true); }}
                className="flex-1 bg-transparent text-xs focus:outline-none" />
            </div>
            {agencyDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto p-1">
                {filteredAgencies.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center">No agencies found</div>
                ) : filteredAgencies.map((a: any) => {
                  const sel = selectedAgencyIds.includes(a._id);
                  return (
                    <div key={a._id} onClick={() => toggleAgency(a._id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${sel ? 'bg-cyan-500/10 text-cyan-600 font-semibold' : 'hover:bg-muted'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel ? 'bg-cyan-500 border-cyan-500' : 'border-border'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1">{a.name}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{a.code}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold font-outfit flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-500" /> Your Exams</h3>
          <p className="text-xs text-muted-foreground">Select which exams you want to take. Test series will be filtered accordingly.</p>

          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background cursor-pointer" onClick={() => setExamDropdownOpen(!examDropdownOpen)}>
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search exams..." value={examSearch} onClick={(e) => e.stopPropagation()} onChange={(e) => { setExamSearch(e.target.value); setExamDropdownOpen(true); }}
                className="flex-1 bg-transparent text-xs focus:outline-none" />
            </div>
            {examDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto p-1">
                {filteredExams.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center">{selectedAgencyIds.length > 0 ? 'No exams found for selected agencies' : 'Select an agency first to see exams'}</div>
                ) : filteredExams.map((e: any) => {
                  const sel = selectedExamIds.includes(e._id);
                  return (
                    <div key={e._id} onClick={() => toggleExam(e._id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${sel ? 'bg-violet-500/10 text-violet-600 font-semibold' : 'hover:bg-muted'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel ? 'bg-violet-500 border-violet-500' : 'border-border'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1">{e.name}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{e.code}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </main>
    </div>
  );
}

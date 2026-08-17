'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setAuthToken, getAuthUser } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  Mail,
  GraduationCap,
  Search,
  Check,
  Building2,
  X,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'preferences'>('loading');
  const [message, setMessage] = useState('');

  // Agencies
  const [agencies, setAgencies] = useState<any[]>([]);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  // Exams
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examSearch, setExamSearch] = useState('');
  const [examsLoading, setExamsLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (res.success) {
          // Store token and user
          setAuthToken(res.data.token, res.data.user);
          // Load agencies for preferences
          const agencyRes = await api.get('/agencies').catch(() => ({ data: [] }));
          setAgencies(agencyRes.data || []);
          setStatus('preferences');
        } else {
          setStatus('error');
          setMessage(res.message || 'Verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token]);

  const filteredAgencies = useMemo(() => {
    if (!agencySearch.trim()) return agencies;
    const s = agencySearch.toLowerCase();
    return agencies.filter(
      (a: any) => a.name?.toLowerCase().includes(s) || a.code?.toLowerCase().includes(s)
    );
  }, [agencies, agencySearch]);

  const selectedAgencyObjects = agencies.filter((a: any) =>
    selectedAgencyIds.includes(a._id)
  );

  const toggleAgency = (id: string) => {
    setSelectedAgencyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeAgency = (id: string) => {
    setSelectedAgencyIds((prev) => prev.filter((x) => x !== id));
  };

  const fetchExamsForAgencies = async (agencyIds: string[]) => {
    setExamsLoading(true);
    try {
      const results = await Promise.all(
        agencyIds.map((id) => api.get(`/exams?agencyId=${id}`).catch(() => ({ data: [] })))
      );
      const allExams = results.flatMap((r) => r.data || []);
      const seen = new Set<string>();
      const unique = allExams.filter((e: any) => {
        if (seen.has(e._id)) return false;
        seen.add(e._id);
        return true;
      });
      setAvailableExams(unique);
    } catch {
      setAvailableExams([]);
    }
    setExamsLoading(false);
  };

  // When agencies are selected, fetch exams
  useEffect(() => {
    if (selectedAgencyIds.length > 0) {
      fetchExamsForAgencies(selectedAgencyIds);
    } else {
      setAvailableExams([]);
    }
  }, [selectedAgencyIds]);

  const toggleExam = (id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.patch('/auth/preferences', {
        agencies: selectedAgencyIds,
        exams: selectedExamIds,
      });
    } catch {}
    const user = getAuthUser();
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const updatedUser = {
      ...(user || {}),
      agencies: selectedAgencyIds,
      exams: selectedExamIds,
    };
    setAuthToken(token, updatedUser);
    setSavingPrefs(false);
    router.push('/dashboard');
  };

  const skipPreferences = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 transition-colors duration-300 font-sans">
      <Link
        href="/login"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to login
      </Link>

      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-bold font-outfit mb-2">Verifying your email...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-bold font-outfit mb-2">Verification Failed</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm shadow-lg shadow-primary/25 text-center"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Preferences Modal - Agency + Exam Selection */}
        {status === 'preferences' && (
          <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold font-outfit">Email Verified!</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Set your preferences to personalize your dashboard.
              </p>
            </div>

            {/* Step 1: Agencies */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-muted-foreground">
                Select Agencies
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <div
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm min-h-[42px] cursor-pointer flex flex-wrap gap-1.5 items-center"
                  onClick={() => setAgencyDropdownOpen(!agencyDropdownOpen)}
                >
                  {selectedAgencyObjects.length === 0 && (
                    <span className="text-muted-foreground">Search and select agencies...</span>
                  )}
                  {selectedAgencyObjects.map((a: any) => (
                    <span
                      key={a._id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-semibold"
                    >
                      {a.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAgency(a._id);
                        }}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground absolute right-3 top-3 transition-transform ${
                    agencyDropdownOpen ? 'rotate-180' : ''
                  }`}
                />

                {agencyDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search agencies..."
                          value={agencySearch}
                          autoFocus
                          onChange={(e) => setAgencySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredAgencies.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                          No agencies found
                        </div>
                      ) : (
                        filteredAgencies.map((a: any) => {
                          const selected = selectedAgencyIds.includes(a._id);
                          return (
                            <div
                              key={a._id}
                              onClick={() => toggleAgency(a._id)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                                selected
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  selected ? 'bg-primary border-primary' : 'border-border'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="flex-1">{a.name}</span>
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {a.code}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Exams (only show if agencies selected) */}
            {selectedAgencyIds.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Exams
                </label>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background">
                  {examsLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
                      Loading exams...
                    </div>
                  ) : availableExams.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No exams found for the selected agencies.
                    </div>
                  ) : (
                    <div className="p-2 flex flex-col gap-1.5">
                      <div className="relative mb-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search exams..."
                          value={examSearch}
                          onChange={(e) => setExamSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      {availableExams
                        .filter((exam: any) => {
                          if (!examSearch.trim()) return true;
                          const s = examSearch.toLowerCase();
                          return (
                            exam.name?.toLowerCase().includes(s) ||
                            exam.code?.toLowerCase().includes(s)
                          );
                        })
                        .map((exam: any) => {
                          const selected = selectedExamIds.includes(exam._id);
                          return (
                            <div
                              key={exam._id}
                              onClick={() => toggleExam(exam._id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                selected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  selected ? 'bg-primary border-primary' : 'border-border'
                                }`}
                              >
                                {selected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs">{exam.name}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {exam.code}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={skipPreferences}
                className="flex-1 py-3 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingPrefs ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

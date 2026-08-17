'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setAuthToken, getAuthUser } from '@/lib/api';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  Building2,
  GraduationCap,
  Search,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // OTP / phone login (flagged feature — dev mode returns OTP in response)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDevHint, setOtpDevHint] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Agency multi-select
  const [agencies, setAgencies] = useState<any[]>([]);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  // Email verification required
  const [showVerifyRequired, setShowVerifyRequired] = useState(false);
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');

  // Post-signup exam modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examSearch, setExamSearch] = useState('');
  const [examsLoading, setExamsLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const ref = searchParams.get('ref');
    setIsSignUp(mode === 'signup');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  useEffect(() => {
    if (isSignUp) {
      api
        .get('/agencies')
        .then((res) => setAgencies(res.data || []))
        .catch(() => {});
    }
  }, [isSignUp]);

  const filteredAgencies = useMemo(() => {
    if (!agencySearch.trim()) return agencies;
    const s = agencySearch.toLowerCase();
    return agencies.filter(
      (a: any) =>
        a.name?.toLowerCase().includes(s) || a.code?.toLowerCase().includes(s)
    );
  }, [agencies, agencySearch]);

  const toggleAgency = (id: string) => {
    setSelectedAgencyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeAgency = (id: string) => {
    setSelectedAgencyIds((prev) => prev.filter((x) => x !== id));
  };

  const selectedAgencyObjects = agencies.filter((a: any) =>
    selectedAgencyIds.includes(a._id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const res = await api.post('/auth/register', {
          name,
          email,
          password,
          agencies: selectedAgencyIds.length ? selectedAgencyIds : undefined,
          referralCode: referralCode || undefined,
          signupSource: referralCode ? 'referral' : undefined,
        });

        if (res.emailVerified) {
          setAuthToken(res.data.token, res.data.user);
          if (selectedAgencyIds.length) {
            fetchExamsForAgencies(selectedAgencyIds);
          } else {
            router.push('/dashboard');
          }
        } else {
          setVerifyEmailAddr(email);
          setShowVerifyRequired(true);
        }
      } else {
        const res = await api.post('/auth/login', { email, password });
        setAuthToken(res.data.token || res.data.accessToken, res.data.user);
        const user = getAuthUser() || { role: 'User' };
        router.push(
          user.role === 'Super Admin' ? '/admin/dashboard' : '/dashboard'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamsForAgencies = async (agencyIds: string[]) => {
    setExamsLoading(true);
    try {
      const results = await Promise.all(
        agencyIds.map((id) =>
          api.get(`/exams?agencyId=${id}`).catch(() => ({ data: [] }))
        )
      );
      const allExams = results.flatMap((r) => r.data || []);
      // Dedupe by _id
      const seen = new Set<string>();
      const unique = allExams.filter((e: any) => {
        if (seen.has(e._id)) return false;
        seen.add(e._id);
        return true;
      });
      setAvailableExams(unique);
      setSelectedExamIds([]);
      setExamSearch('');
      setShowExamModal(true);
    } catch {
      setAvailableExams([]);
    }
    setExamsLoading(false);
  };

  const toggleExam = (id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveExamPreferences = async () => {
    setSavingPrefs(true);
    const user = getAuthUser();
    const existingAgencies = user?.agencies || selectedAgencyIds;
    try {
      await api.patch('/auth/preferences', {
        agencies: existingAgencies,
        exams: selectedExamIds,
      });
    } catch {}
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const updatedUser = {
      ...(user || {}),
      agencies: existingAgencies,
      exams: selectedExamIds,
    };
    setAuthToken(token, updatedUser);
    setSavingPrefs(false);
    router.push('/dashboard');
  };

  const skipExamSelection = () => {
    router.push('/dashboard');
  };

  const requestOtp = async () => {
    setOtpLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/otp-request', { phone });
      setOtpSent(true);
      setOtpDevHint(
        res.data?.data?.devOtp ? `Dev OTP: ${res.data.data.devOtp}` : ''
      );
    } catch (err: any) {
      setError(err.message || 'Could not send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/otp-login', { phone, otp });
      setAuthToken(res.data.token || res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl border border-border bg-card shadow-2xl relative max-h-[90vh] overflow-y-auto">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-xl"></div>

      <div className="flex items-center gap-2 mb-8 justify-center">
        <img src="/logo.png" alt="ExamOS" className="w-9 h-9 rounded-xl object-contain" />
        <span className="font-bold text-xl tracking-tight font-outfit">
          ExamOS Login
        </span>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold font-outfit">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {isSignUp
            ? 'Join the next-gen assessment suite.'
            : 'Sign in to access mock tests and analytics.'}
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-semibold">
          {error}
        </div>
      )}

      {!isSignUp && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-secondary/70 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`py-2 rounded-lg transition-colors ${
              authMode === 'email'
                ? 'bg-card shadow text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`py-2 rounded-lg transition-colors ${
              authMode === 'otp'
                ? 'bg-card shadow text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Phone / OTP
          </button>
        </div>
      )}

      {authMode === 'otp' && !isSignUp ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Mobile Number
            </label>
            <div className="relative">
              <span className="text-sm text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={requestOtp}
              disabled={otpLoading || phone.length !== 10}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm flex items-center justify-center shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {otpLoading ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <>
              {otpDevHint && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 text-xs font-semibold">
                  {otpDevHint}{' '}
                  <span className="text-muted-foreground font-normal">
                    (SMS gateway not wired — dev mode)
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Enter OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm tracking-[0.4em] text-center transition-all"
                />
              </div>
              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm flex items-center justify-center shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                className="text-xs text-muted-foreground hover:text-primary self-center"
              >
                Resend / change number
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
          </div>

          {/* Multi-select Agencies */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Select Agencies
              </label>
              <div className="relative">
                <Building2 className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-3" />
                <div
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm min-h-[42px] cursor-pointer flex flex-wrap gap-1.5 items-center"
                  onClick={() => setAgencyDropdownOpen(!agencyDropdownOpen)}
                >
                  {selectedAgencyObjects.length === 0 && (
                    <span className="text-muted-foreground">
                      Search and select agencies...
                    </span>
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
                                  selected
                                    ? 'bg-primary border-primary'
                                    : 'border-border'
                                }`}
                              >
                                {selected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 transition-all text-sm flex items-center justify-center mt-2 shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {loading
              ? 'Authenticating...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>
      )}

      <div className="text-center mt-6 text-xs text-muted-foreground">
        {isSignUp ? (
          <span>
            Already have an account?{' '}
            <button
              onClick={() => setIsSignUp(false)}
              className="text-primary font-bold hover:underline"
            >
              Sign In
            </button>
          </span>
        ) : (
          <span>
            New to ExamOS?{' '}
            <button
              onClick={() => setIsSignUp(true)}
              className="text-primary font-bold hover:underline"
            >
              Sign Up
            </button>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
        className="w-full py-3 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium flex items-center justify-center gap-2.5 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </a>

      {/* Email Verification Required Screen */}
      {showVerifyRequired && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl flex flex-col items-center py-12 px-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-outfit text-center">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
              We sent a verification link to{' '}
              <span className="font-semibold text-foreground">{verifyEmailAddr}</span>.
              Please check your inbox and click the link to activate your account.
            </p>
            <button
              onClick={() => {
                setShowVerifyRequired(false);
                router.push('/login');
              }}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/95 transition-all shadow-lg shadow-primary/25"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
      {showExamModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-border shadow-2xl flex flex-col">
            <div className="p-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold font-outfit flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Choose Your Exams
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                Select the exams you want to prepare for. These will determine
                which test series appear on your dashboard.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {examsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
                  Loading exams...
                </div>
              ) : availableExams.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No exams found for the selected agencies.
                </div>
              ) : (
                <>
                  <div className="relative mb-4">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search exams..."
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
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
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                              selected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                selected
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {selected && (
                                <Check className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm">{exam.name}</h4>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {exam.code}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    {availableExams.filter((exam: any) => {
                      if (!examSearch.trim()) return true;
                      const s = examSearch.toLowerCase();
                      return (
                        exam.name?.toLowerCase().includes(s) ||
                        exam.code?.toLowerCase().includes(s)
                      );
                    }).length === 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No exams match "{examSearch}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-border flex gap-3">
              <button
                onClick={skipExamSelection}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={saveExamPreferences}
                disabled={savingPrefs || selectedExamIds.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingPrefs
                  ? 'Saving...'
                  : `Save ${selectedExamIds.length || ''} Exam${
                      selectedExamIds.length !== 1 ? 's' : ''
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 transition-colors duration-300 font-sans">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl border border-border bg-card shadow-2xl flex items-center justify-center min-h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
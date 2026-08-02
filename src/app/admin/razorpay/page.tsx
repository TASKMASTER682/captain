'use client';

import React, { useEffect, useState } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Save, Shield, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RazorpaySettings() {
  const router = useRouter();
  const [keys, setKeys] = useState({ keyId: '', keySecret: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadKeys();
  }, [router]);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/razorpay');
      setKeys({ keyId: res.data?.keyId || '', keySecret: res.data?.keySecret || '' });
    } catch { }
    setLoading(false);
  };

  const saveKeys = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/admin/razorpay', keys);
      setMessage({ type: 'success', text: 'Razorpay keys saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save keys.' });
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Shield className="w-5 h-5 text-rose-500" />
          <h1 className="font-bold text-lg font-outfit">Razorpay Configuration</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <strong>Security Note:</strong> Razorpay keys are stored encrypted in the database. Only Super Admins can access this page. 
              Use Test Mode keys for development. Never commit keys to version control.
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Key ID (Public)</label>
              <input
                type="text"
                value={keys.keyId}
                onChange={(e) => setKeys({ ...keys, keyId: e.target.value })}
                placeholder="rzp_test_... or rzp_live_..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Prefix <code>rzp_test_</code> for test mode, <code>rzp_live_</code> for production.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                Key Secret (Private)
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="text-xs text-primary hover:underline">
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={keys.keySecret}
                onChange={(e) => setKeys({ ...keys, keySecret: e.target.value })}
                placeholder="Enter key secret"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          {message && (
            <div className={`mt-5 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border flex gap-3">
            <button
              onClick={saveKeys}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-5 rounded-2xl border border-border bg-card shadow-sm">
          <h3 className="font-bold text-sm font-outfit mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> How It Works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Without keys: Payments use <strong>offline mode</strong> (auto-verify for testing)</li>
            <li>• With Test keys: Real Razorpay checkout in test mode (no real money)</li>
            <li>• With Live keys: Real payments in production</li>
            <li>• Keys are sent to frontend only during checkout; secret never leaves backend</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
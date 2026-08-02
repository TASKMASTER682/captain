'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { Crown, Plus, Edit3, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PlansManagement() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, billingCycle: 'monthly', durationDays: 30, features: '', active: true, popular: false });

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadPlans();
  }, [router]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, billingCycle: 'monthly', durationDays: 30, features: '', active: true, popular: false });
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', price: p.price || 0,
      billingCycle: p.billingCycle || 'monthly', durationDays: p.durationDays || 30,
      features: (p.features || []).join('\n'), active: p.active !== false, popular: !!p.popular,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        features: form.features.split('\n').map((f: string) => f.trim()).filter(Boolean),
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Crown className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-lg font-outfit">Plans & Pricing</h1>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Crown className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No plans yet. Create your first subscription plan.</p>
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
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <div className="flex flex-col gap-1.5">
                  {p.features?.map((f: string, i: number) => <span key={i} className="text-xs flex items-center gap-1.5"><span className="text-emerald-500">✓</span>{f}</span>)}
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
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Plan Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Premium Monthly" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
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
                  <label className="text-xs font-semibold text-muted-foreground">Duration (days, 0=lifetime)</label>
                  <input type="number" value={form.durationDays} onChange={e => setForm({...form, durationDays: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
                <label className="flex items-center gap-2 pt-7 text-xs font-semibold text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                  Popular badge
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Features (one per line)</label>
                <textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm h-24" placeholder={'All mock tests unlocked\nDetailed solutions\nPerformance analytics'} />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                Active
              </label>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { Ticket, Plus, Edit3, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CouponsManagement() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', discountType: 'percent', value: 10, maxUses: 0, minAmount: 0, expiresAt: '', active: true });

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', discountType: 'percent', value: 10, maxUses: 0, minAmount: 0, expiresAt: '', active: true });
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code, discountType: c.discountType, value: c.value, maxUses: c.maxUses || 0,
      minAmount: c.minAmount || 0, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', active: c.active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        value: Number(form.value), maxUses: Number(form.maxUses), minAmount: Number(form.minAmount),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editing) { await api.put(`/coupons/${editing._id}`, payload); }
      else { await api.post('/coupons', payload); }
      setShowForm(false);
      await load();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.delete(`/coupons/${id}`); await load(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Ticket className="w-5 h-5 text-pink-500" />
          <h1 className="font-bold text-lg font-outfit">Coupons</h1>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No coupons yet.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {coupons.map(c => {
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
              return (
                <div key={c._id} className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-pink-500/10 text-pink-500 font-bold text-sm tracking-wider">{c.code}</span>
                      <span className="text-xs font-semibold">{c.discountType === 'percent' ? `${c.value}% off` : `₹${c.value} off`}</span>
                      {!c.active && <span className="text-[10px] text-rose-500 font-bold">Inactive</span>}
                      {expired && <span className="text-[10px] text-rose-500 font-bold">Expired</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5">
                      {c.maxUses > 0 ? `${c.usedCount}/${c.maxUses} used` : `${c.usedCount} used`}
                      {c.minAmount > 0 ? ` · Min order ₹${c.minAmount}` : ''}
                      {c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ' · No expiry'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Code</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold tracking-wider" placeholder="e.g. WELCOME20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="percent">Percent</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Max Uses (0=unlimited)</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Min Order (₹)</label>
                  <input type="number" value={form.minAmount} onChange={e => setForm({...form, minAmount: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Expiry Date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-pink-500" /> Active
              </label>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Coupon</button>
          </div>
        </div>
      )}
    </div>
  );
}

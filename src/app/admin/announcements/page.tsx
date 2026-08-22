'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { Megaphone, Plus, Edit3, Trash2, ArrowLeft, Save, X, Power } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AnnouncementsManagement() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all', type: 'info', accentColor: '', expiresAt: '', active: true, sendEmail: false });

  const typeColorMap: Record<string, string> = { info: '#0ea5e9', success: '#10b981', warning: '#f59e0b', danger: '#f43f5e' };

  useEffect(() => {
    const activeUser = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!user || !staffRoles.includes(user.role)) { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      setItems(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    const t = 'info';
    setForm({ title: '', message: '', audience: 'all', type: t, accentColor: typeColorMap[t], expiresAt: '', active: true, sendEmail: false });
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ title: a.title, message: a.message, audience: a.audience, type: a.type, accentColor: a.accentColor || typeColorMap[a.type] || '', expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 10) : '', active: a.active !== false, sendEmail: !!a.sendEmail });
    setShowForm(true);
  };

  const handleTypeChange = (newType: string) => {
    setForm(f => ({ ...f, type: newType, accentColor: typeColorMap[newType] || f.accentColor }));
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (editing) { await api.put(`/announcements/${editing._id}`, payload); }
      else { await api.post('/announcements', payload); }
      setShowForm(false);
      await load();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); await load(); }
    catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (a: any) => {
    try { await api.put(`/announcements/${a._id}`, { active: !a.active }); await load(); }
    catch (err: any) { alert(err.message); }
  };

  const typeColors: any = { info: 'bg-sky-500/10 text-sky-500', success: 'bg-emerald-500/10 text-emerald-500', warning: 'bg-amber-500/10 text-amber-500', danger: 'bg-rose-500/10 text-rose-500' };

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No announcements yet.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(a => (
              <div key={a._id} className={`p-5 rounded-2xl border bg-card flex items-start justify-between gap-4 transition-all ${a.active ? 'border-border' : 'border-border/40 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${typeColors[a.type] || typeColors.info}`} style={a.accentColor ? { backgroundColor: `${a.accentColor}15`, color: a.accentColor } : {}}><Megaphone className="w-4 h-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{a.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-semibold">{a.audience === 'all' ? 'Everyone' : a.audience}</span>
                      {!a.active && <span className="text-[10px] text-rose-500 font-bold">Hidden</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(a.createdAt).toLocaleString()}
                      {a.expiresAt && <span className={`ml-2 ${new Date(a.expiresAt) < new Date() ? 'text-rose-500 font-semibold' : ''}`}> · Expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
                    </div>
                    {a.sendEmail && (
                      <div className="text-[10px] mt-1">
                        {a.emailSentAt
                          ? <span className="text-emerald-500 font-semibold">📧 Email blast sent {new Date(a.emailSentAt).toLocaleString()}</span>
                          : <span className="text-amber-500 font-semibold">📧 Email blast requested</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(a)} className={`p-2 rounded-xl transition-colors ${a.active ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`} title={a.active ? 'Hide' : 'Show'}><Power className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(a)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(a._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. New mock test published" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm h-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Audience</label>
                  <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="all">Everyone</option>
                    <option value="users">Students</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <select value={form.type} onChange={e => handleTypeChange(e.target.value)} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accentColor || '#6366f1'} onChange={e => setForm({...form, accentColor: e.target.value})} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                  <input type="text" value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})} className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono" placeholder="#6366f1 (leave empty for default)" />
                  {form.accentColor && (
                    <button type="button" onClick={() => setForm({...form, accentColor: ''})} className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80">Reset</button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Expiry Date (optional)</label>
                <div className="flex items-center gap-3">
                  <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                  {form.expiresAt && (
                    <button type="button" onClick={() => setForm({...form, expiresAt: ''})} className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80">Clear</button>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">Leave empty for no expiry</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-sky-500" /> Active
              </label>
              {!editing && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.sendEmail} onChange={e => setForm({...form, sendEmail: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  Email blast to {form.audience === 'admin' ? 'admins' : form.audience === 'users' ? 'all students' : 'all users'} on publish
                </label>
              )}
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Announcement</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
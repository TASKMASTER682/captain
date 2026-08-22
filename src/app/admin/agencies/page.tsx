'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Building2, Plus, Edit3, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

export default function AgencyManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    setUser(activeUser);
    loadAgencies();
  }, [router]);

  const loadAgencies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agencies');
      setAgencies(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ name: a.name, code: a.code, description: a.description || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/agencies/${editing._id}`, form);
      } else {
        await api.post('/agencies', form);
      }
      setShowForm(false);
      await loadAgencies();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this agency?')) return;
    try {
      await api.delete(`/agencies/${id}`);
      await loadAgencies();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No agencies yet. Create your first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {agencies.map(a => (
              <div key={a._id} className="p-6 rounded-3xl border border-border bg-card flex items-center justify-between hover:border-cyan-500/30 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{a.name}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 text-[10px] font-bold">{a.code}</span>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                </div>
                <div className="flex gap-2">
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
          <div className="bg-card w-full max-w-lg p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Agency' : 'New Agency'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Agency Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Staff Selection Commission" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Code</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2" placeholder="e.g. SSC" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none h-20" />
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Agency</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
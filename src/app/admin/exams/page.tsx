'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { GraduationCap, Plus, Edit3, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function ExamManagement() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', agencyId: '' });

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eRes, aRes] = await Promise.all([api.get('/exams'), api.get('/agencies')]);
      setExams(eRes.data || []);
      setAgencies(aRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', agencyId: agencies[0]?._id || '' });
    setShowForm(true);
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({ name: e.name, code: e.code, description: e.description || '', agencyId: e.agencyId?._id || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/exams/${editing._id}`, form);
      } else {
        await api.post('/exams', form);
      }
      setShowForm(false);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    try { await api.delete(`/exams/${id}`); await loadData(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No exams yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exams.map(ex => (
              <div key={ex._id} className="p-6 rounded-3xl border border-border bg-card flex items-center justify-between hover:border-violet-500/30 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{ex.name}</span>
                    <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold">{ex.code}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">{ex.agencyId?.name || 'N/A'}</span>
                    {ex.description && <span className="text-xs text-muted-foreground">{ex.description}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(ex)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(ex._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Exam' : 'New Exam'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Agency</label>
                <select value={form.agencyId} onChange={e => setForm({...form, agencyId: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none">
                  {agencies.map(a => <option key={a._id} value={a._id}>{a.name} ({a.code})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Exam Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Combined Graduate Level Exam" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Code</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none" placeholder="e.g. SSC-CGL" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none h-20" />
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Exam</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
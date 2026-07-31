'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { Layers, Plus, Edit3, Trash2, ArrowLeft, Save, X, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TestSeriesManagement() {
  const router = useRouter();
  const [series, setSeries] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', price: 0, tags: '', agencyId: '', examId: '' });

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, eRes] = await Promise.all([api.get('/test-series'), api.get('/agencies'), api.get('/exams')]);
      setSeries(sRes.data || []);
      setAgencies(aRes.data || []);
      setAllExams(eRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredExams = allExams.filter((ex: any) =>
    !form.agencyId || (ex.agencyId?._id || ex.agencyId) === form.agencyId
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', price: 0, tags: '', agencyId: '', examId: '' });
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    const exam = allExams.find((ex: any) => (ex._id === s.examId?._id || ex._id === s.examId));
    setEditing(s);
    setForm({
      title: s.title, description: s.description || '', price: s.price || 0,
      tags: (s.tags || []).join(', '),
      agencyId: exam?.agencyId?._id || exam?.agencyId || '',
      examId: s.examId?._id || s.examId || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean), price: Number(form.price) };
      if (editing) {
        await api.put(`/test-series/${editing._id}`, payload);
      } else {
        await api.post('/test-series', payload);
      }
      setShowForm(false);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this test series?')) return;
    try { await api.delete(`/test-series/${id}`); await loadData(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Layers className="w-5 h-5 text-orange-500" />
          <h1 className="font-bold text-lg font-outfit">Test Series Management</h1>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Series
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : series.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No test series yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {series.map(s => {
              const exam = allExams.find((ex: any) => ex._id === (s.examId?._id || s.examId));
              const agencyName = exam?.agencyId?.name || '';
              return (
                <div key={s._id} className="p-6 rounded-3xl border border-border bg-card flex items-center justify-between hover:border-orange-500/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{s.title}</span>
                      {s.price > 0 ? <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">₹{s.price}</span> : <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Free</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {agencyName && <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">{agencyName}</span>}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">{exam?.name || 'N/A'}</span>
                      {s.description && <span className="text-xs text-muted-foreground">{s.description}</span>}
                    </div>
                    {s.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {s.tags.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/test-series/${s._id}`} className="p-2 rounded-xl bg-secondary text-primary hover:bg-primary hover:text-white transition-colors" title="View Tests"><Layers className="w-4 h-4" /></Link>
                    <button onClick={() => openEdit(s)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-lg p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Test Series' : 'New Test Series'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Agency</label>
                <select value={form.agencyId} onChange={e => setForm({...form, agencyId: e.target.value, examId: ''})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none">
                  <option value="">Select Agency</option>
                  {agencies.map((a: any) => <option key={a._id} value={a._id}>{a.name} ({a.code})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Exam (under selected agency)</label>
                <select value={form.examId} onChange={e => setForm({...form, examId: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none" disabled={!form.agencyId}>
                  <option value="">{form.agencyId ? 'Select Exam' : 'Select an agency first'}</option>
                  {filteredExams.map((ex: any) => <option key={ex._id} value={ex._id}>{ex.name} ({ex.code})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Tier 1 Premium Mock Series" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Price (0 = Free)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="SSC, CGL, Tier 1" />
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Series</button>
          </div>
        </div>
      )}
    </div>
  );
}

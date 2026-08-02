'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Plus, Edit3, Trash2, Save, X, FileText, File, Video, Power, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MaterialsManagement() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', type: 'pdf', externalUrl: '',
    tags: '', subject: '', topic: '', examId: '', agencyId: '', fileSize: '', active: true,
  });
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!user || !staffRoles.includes(user.role)) { router.push('/login'); return; }
    load();
    api.get('/exams').then(r => setExams(r.data || [])).catch(() => {});
    api.get('/agencies').then(r => setAgencies(r.data || [])).catch(() => {});
  }, [router]);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await api.get(`/materials?${params.toString()}`);
      setItems(res.data || []);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', type: 'pdf', externalUrl: '', tags: '', subject: '', topic: '', examId: '', agencyId: '', fileSize: '', active: true });
    setShowForm(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      title: m.title, description: m.description || '', type: m.type,
      externalUrl: m.externalUrl, tags: (m.tags || []).join(', '),
      subject: m.subject || '', topic: m.topic || '',
      examId: m.examId?._id || m.examId || '', agencyId: m.agencyId?._id || m.agencyId || '',
      fileSize: m.fileSize || '', active: m.active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.externalUrl) { alert('Title and External URL are required.'); return; }
    try {
      const payload = { ...form };
      if (editing) { await api.put(`/materials/${editing._id}`, payload); }
      else { await api.post('/materials', payload); }
      setShowForm(false);
      await load(search);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this study material?')) return;
    try { await api.delete(`/materials/${id}`); await load(search); }
    catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (m: any) => {
    try { await api.put(`/materials/${m._id}`, { active: !m.active }); await load(search); }
    catch (err: any) { alert(err.message); }
  };

  const typeMeta: any = {
    note: { icon: FileText, color: 'text-sky-500 bg-sky-500/10', label: 'Note' },
    pdf: { icon: File, color: 'text-rose-500 bg-rose-500/10', label: 'PDF' },
    video: { icon: Video, color: 'text-violet-500 bg-violet-500/10', label: 'Video' },
  };

  const onSearchChange = (v: string) => {
    setSearch(v);
    load(v);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg font-outfit">Study Materials</h1>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Material
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search title, subject, tags..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No study materials yet.</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(m => {
              const meta = typeMeta[m.type] || typeMeta.note;
              const Icon = meta.icon;
              return (
                <div key={m._id} className={`p-5 rounded-2xl border bg-card flex items-start justify-between gap-4 transition-all ${m.active ? 'border-border' : 'border-border/40 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${meta.color}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{m.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-semibold">{meta.label}</span>
                        {!m.active && <span className="text-[10px] text-rose-500 font-bold">Hidden</span>}
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.description}</p>}
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[10px]">
                        {m.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{m.subject}</span>}
                        {m.examId?.name && <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground">{m.examId.name}</span>}
                        {(m.tags || []).slice(0, 4).map((t: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">#{t}</span>
                        ))}
                        <span className="text-muted-foreground">{m.downloadCount || 0} downloads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleActive(m)} className={`p-2 rounded-xl transition-colors ${m.active ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`} title={m.active ? 'Hide' : 'Show'}><Power className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(m)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(m._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-xl p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">{editing ? 'Edit Study Material' : 'New Study Material'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Quantitative Aptitude Notes" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="note">Note</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">External URL (file hosted elsewhere — served via direct download)</label>
                <input type="text" value={form.externalUrl} onChange={e => setForm({...form, externalUrl: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono" placeholder="https://example.com/files/notes.pdf" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Mathematics" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Topic</label>
                  <input type="text" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. Profit & Loss" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="quant, arithmetic, prelims" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Exam</label>
                  <select value={form.examId} onChange={e => setForm({...form, examId: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="">None</option>
                    {exams.map((ex: any) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Agency</label>
                  <select value={form.agencyId} onChange={e => setForm({...form, agencyId: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="">None</option>
                    {agencies.map((ag: any) => <option key={ag._id} value={ag._id}>{ag.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">File Size (optional)</label>
                  <input type="text" value={form.fileSize} onChange={e => setForm({...form, fileSize: e.target.value})} className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. 2.4 MB" />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer mt-7">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-primary" /> Active
                </label>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Material</button>
          </div>
        </div>
      )}
    </div>
  );
}

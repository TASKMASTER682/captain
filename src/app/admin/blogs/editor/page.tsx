'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, Save, Send, X, Search, FileText, File, Video, Plus, Trash2, Newspaper, Code2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SEO_SCHEMAS, getSeoSchemaDef, type SeoSchemaType } from '@/app/blogs/seo-schemas';

interface MaterialItem {
  _id: string;
  title: string;
  type: string;
  subject?: string;
  topic?: string;
  fileSize?: string;
  externalUrl?: string;
}

interface SeoConfig { [key: string]: unknown }

function BlogEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', coverImage: '',
    tags: '', subject: '', status: 'draft',
  });
  const [seoSchema, setSeoSchema] = useState<SeoSchemaType>('BlogPosting');
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({});
  const [attached, setAttached] = useState<MaterialItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  // Material attach picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [matSearch, setMatSearch] = useState('');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    const staffRoles = ['Super Admin', 'Content Manager', 'Support'];
    if (!user || !staffRoles.includes(user.role)) { router.push('/login'); return; }

    if (editId) {
      api.get(`/blogs/${editId}`).then(r => {
        const b = r.data;
        setForm({
          title: b.title, slug: b.slug || '', excerpt: b.excerpt || '', content: b.content || '',
          coverImage: b.coverImage || '', tags: (b.tags || []).join(', '),
          subject: b.subject || '', status: b.status || 'draft',
        });
        setSeoSchema((b.seoSchema || 'BlogPosting') as SeoSchemaType);
        setSeoConfig(b.seoConfig && typeof b.seoConfig === 'object' ? b.seoConfig : {});
        setAttached(b.materials || []);
        setLoading(false);
      }).catch(() => { setLoading(false); router.push('/admin/blogs'); });
    }
  }, [editId, router]);

  const searchMaterials = async (q: string) => {
    setMatSearch(q);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await api.get(`/materials?${params.toString()}`);
      const existing = attached.map((m: any) => m._id);
      setMaterials((res.data || []).filter((m: any) => !existing.includes(m._id)));
    } catch (_e) { setMaterials([]); }
  };

  const attachMaterial = (m: any) => {
    setAttached(prev => [...prev, m]);
    setMaterials(prev => prev.filter(x => x._id !== m._id));
  };

  const detachMaterial = (id: string) => {
    setAttached(prev => prev.filter(m => m._id !== id));
  };

  const save = async (status: string) => {
    if (!form.content.trim()) { alert('Please paste the blog HTML content.'); return; }
    const title = extractTitle(form.content);
    if (!title) { alert('No <h1> title found in the content. Add an <h1> tag first.'); return; }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug || undefined, content: form.content, coverImage: form.coverImage,
        tags: form.tags, subject: form.subject, seoSchema, seoConfig,
        status,
        materials: attached.map((m: MaterialItem) => m._id),
      };
      if (editId) { await api.put(`/blogs/${editId}`, payload); }
      else { await api.post('/blogs', payload); }
      router.push('/admin/blogs');
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const typeMeta: any = {
    note: { icon: FileText, color: 'text-sky-500 bg-sky-500/10', label: 'Note' },
    pdf: { icon: File, color: 'text-rose-500 bg-rose-500/10', label: 'PDF' },
    video: { icon: Video, color: 'text-violet-500 bg-violet-500/10', label: 'Video' },
  };

  // Extract the title from the first <h1> tag in the pasted HTML
  const extractTitle = (html: string): string => {
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // Auto-derive SEO fields from the pasted HTML (title, slug, description)
  const derivedTitle = extractTitle(form.content);
  const derivedSlug = derivedTitle
    ? derivedTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    : '';
  const derivedDescription = (() => {
    const s = form.content;
    const meta =
      s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      s.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    if (meta && meta[1] && meta[1].trim()) return meta[1].trim().slice(0, 300);
    const afterH1 = s.slice(s.toLowerCase().indexOf('</h1>') + 5);
    const paras = afterH1.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    for (const p of paras) {
      const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length >= 40) return text.slice(0, 300);
    }
    return afterH1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  })();

  const schemaDef = getSeoSchemaDef(seoSchema);

  const setSeoField = (key: string, value: string) => setSeoConfig(prev => ({ ...prev, [key]: value }));

  const setSeoRepeatItem = (key: string, index: number, subKey: string, value: string) => {
    setSeoConfig(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as unknown[])] : [];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...(arr[index] as object), [subKey]: value };
      return { ...prev, [key]: arr };
    });
  };

  const removeSeoRepeatItem = (key: string, index: number) => {
    setSeoConfig(prev => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as unknown[])] : [];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  const addSeoRepeatItem = (key: string) => {
    setSeoConfig(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : [])] }));
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <Newspaper className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg font-playfair">{editId ? 'Edit Blog' : 'New Blog'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted flex items-center gap-1.5">
            {preview ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={() => save('draft')} disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => save('published')} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 flex items-center gap-1.5">
            <Send className="w-4 h-4" /> {form.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-primary">Auto-extracted for SEO (not shown on the reading page):</span> title from your first <span className="font-mono">&lt;h1&gt;</span>, meta description from <span className="font-mono">&lt;meta name=&quot;description&quot;&gt;</span> (or the first paragraph after the <span className="font-mono">&lt;h1&gt;</span>), and tags from your <span className="font-mono">#Tag</span> pills — merged with the Tags field below.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Slug (optional — auto-generated)</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono" placeholder="urbanization-guide" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="e.g. General Studies" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="geography, essay, current-affairs" />
          </div>
        </div>

        {/* SEO Schema Selection */}
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-outfit">SEO Schema (Rich Results)</h3>
              <p className="text-[11px] text-muted-foreground">Choose a schema type. Auto-fields (title, slug, description) come from your HTML content.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Schema Type</label>
              <select value={seoSchema} onChange={e => setSeoSchema(e.target.value as SeoSchemaType)}
                className="px-4 py-3 rounded-xl border border-border bg-background text-sm">
                {SEO_SCHEMAS.map(s => <option key={s.type} value={s.type}>{s.label}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">{schemaDef.description}</p>
            </div>

            {/* Auto-derived fields (read-only preview) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-3">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Title (auto from {'<h1>'})</label>
                <input type="text" readOnly value={derivedTitle || '(no <h1> found)'} className="px-3 py-2 rounded-lg bg-background text-xs font-mono text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Slug (auto from title)</label>
                <input type="text" readOnly value={derivedSlug || '(auto-generated on save)'} className="px-3 py-2 rounded-lg bg-background text-xs font-mono text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <input type="text" readOnly value={derivedDescription || '(not found)'} className="px-3 py-2 rounded-lg bg-background text-xs font-mono text-muted-foreground" />
              </div>
            </div>

            {/* Schema-specific fields */}
            {schemaDef.fields.length > 0 && (
              <div className="border-t border-border pt-3 flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{schemaDef.label} Fields</h4>
                {schemaDef.fields.map(field => (
                  <div key={field.key} className="flex flex-col gap-2">
                    {field.type === 'repeatable' && (
                      <>
                        <label className="text-xs font-semibold text-muted-foreground">{field.label}{field.hint ? <span className="ml-1 text-[10px] font-normal"> ({field.hint})</span> : ''}</label>
                        {(seoConfig[field.key] as unknown[] || []).map((item, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-border bg-background">
                            {field.repeat?.map((sub) => (
                              <div key={sub.key} className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-muted-foreground">{sub.label}</label>
                                {sub.type === 'textarea' ? (
                                  <textarea
                                    value={(item as Record<string, unknown>)[sub.key] as string || ''}
                                    onChange={e => setSeoRepeatItem(field.key, idx, sub.key, e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={sub.placeholder}
                                    rows={3}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={(item as Record<string, unknown>)[sub.key] as string || ''}
                                    onChange={e => setSeoRepeatItem(field.key, idx, sub.key, e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={sub.placeholder}
                                  />
                                )}
                              </div>
                            ))}
                            <button onClick={() => removeSeoRepeatItem(field.key, idx)} className="self-end p-1.5 text-muted-foreground hover:text-rose-500" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addSeoRepeatItem(field.key)} className="px-3 py-2 rounded-lg border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5 justify-center">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </>
                    )}
                    {field.type === 'textarea' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                        <textarea
                          value={(seoConfig[field.key] as string) || ''}
                          onChange={e => setSeoField(field.key, e.target.value)}
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={field.placeholder}
                          rows={3}
                        />
                      </div>
                    )}
                    {field.type === 'text' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                        <input
                          type="text"
                          value={(seoConfig[field.key] as string) || ''}
                          onChange={e => setSeoField(field.key, e.target.value)}
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={field.placeholder}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground">Content (HTML) — paste from your editor. Rendered as-is for readers.</label>
            <span className="text-[10px] text-muted-foreground font-mono">{form.content.length} chars</span>
          </div>
          {preview ? (
            <div className="prose prose-sm max-w-none dark:prose-invert border border-border rounded-xl bg-background p-6 max-h-[520px] overflow-y-auto font-playfair">
              <div dangerouslySetInnerHTML={{ __html: form.content }} />
              {!form.content && <p className="text-muted-foreground text-sm">Nothing to preview yet — write some HTML.</p>}
            </div>
          ) : (
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono h-[420px] outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              placeholder={'<h2>Introduction</h2>\n<p>Paste your rich HTML here...</p>\n<ul>\n  <li>Key point</li>\n</ul>'} />
          )}
        </div>

        {/* Attached study materials */}
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-outfit">Attached Study Materials</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Readers can download these directly from the blog post.</p>
            </div>
            <button onClick={() => { setPickerOpen(true); searchMaterials(''); }}
              className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Attach Material
            </button>
          </div>

          {attached.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">No materials attached yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {attached.map((m: any) => {
                const meta = typeMeta[m.type] || typeMeta.note;
                const Icon = meta.icon;
                return (
                  <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">{meta.label}{m.fileSize ? ` · ${m.fileSize}` : ''}</p>
                    </div>
                    <button onClick={() => detachMaterial(m._id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Material picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-outfit flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Attach Study Material</h3>
              <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-3 flex-1 overflow-y-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={matSearch} onChange={e => searchMaterials(e.target.value)} autoFocus placeholder="Search materials by title, subject, tags..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No matching materials.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {materials.map((m: any) => {
                    const meta = typeMeta[m.type] || typeMeta.note;
                    const Icon = meta.icon;
                    return (
                      <button key={m._id} onClick={() => attachMaterial(m)}
                        className="text-left p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}><Icon className="w-3.5 h-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold line-clamp-1">{m.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{m.subject || 'General'}{m.topic ? ` · ${m.topic}` : ''}</p>
                        </div>
                        <span className="text-primary"><Plus className="w-4 h-4" /></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading...</div>}>
      <BlogEditor />
    </Suspense>
  );
}

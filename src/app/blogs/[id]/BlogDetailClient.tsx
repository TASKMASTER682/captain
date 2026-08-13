'use client';

import React from 'react';
import { ArrowLeft, Newspaper, CalendarDays, Eye, Download, FileText, File, Video } from 'lucide-react';
import Link from 'next/link';
import { downloadMaterial } from '@/lib/api';

// Defense-in-depth: the backend already sanitizes on write + read, but strip
// anything that could execute if a stale/edited blog somehow ships raw HTML.
const sanitizeHtml = (html: string) => String(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
  .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
  .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, '')
  .replace(/<embed\b[^>]*>[\s\S]*?<\/embed\s*>/gi, '')
  .replace(/<link\b[^>]*>/gi, '')
  .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript\s*:/gi, '');

const typeMeta: any = {
  note: { icon: FileText, label: 'Note', color: 'text-sky-500 bg-sky-500/10' },
  pdf: { icon: File, label: 'PDF', color: 'text-rose-500 bg-rose-500/10' },
  video: { icon: Video, label: 'Video', color: 'text-violet-500 bg-violet-500/10' },
};

export default function BlogDetailClient({ blog }: { blog: any }) {
  const handleDownload = async (m: any) => {
    try {
      await downloadMaterial(m._id, m.title);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/blogs" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-lg font-playfair flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" /> Blog
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
            {blog.subject && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{blog.subject}</span>}
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {blog.viewCount || 0} views</span>
            {blog.author?.name && <span>by {blog.author.name}</span>}
          </div>
        </div>

        {/* Rendered blog HTML content — title and description live inside the HTML itself */}
        <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert font-playfair">
          {blog.content ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }} />
          ) : (
            <p className="text-muted-foreground text-sm">This blog has no content yet.</p>
          )}
        </article>

        {/* Attached study materials */}
        {blog.materials && blog.materials.length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold font-playfair flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" /> Study Materials ({blog.materials.length})
            </h3>
            <div className="flex flex-col gap-2">
              {blog.materials.map((m: any) => {
                const meta = typeMeta[m.type] || typeMeta.note;
                const Icon = meta.icon;
                return (
                  <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.color}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">{meta.label}{m.fileSize ? ` · ${m.fileSize}` : ''}{m.subject ? ` · ${m.subject}` : ''}</p>
                    </div>
                    <button onClick={() => handleDownload(m)}
                      className="px-3 py-2 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary/95 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center pb-8">
          <Link href="/blogs" className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors">
            ← Back to all blogs
          </Link>
        </div>
      </main>
    </div>
  );
}
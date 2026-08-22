'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { ArrowLeft, ScrollText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AuditLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser || activeUser.role !== 'Super Admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <AdminLayout user={user}>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground"><ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No audit logs yet.</p></div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {logs.map(l => (
              <div key={l._id} className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-bold tracking-wide">{l.action}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{l.details}</p>
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  {l.userId?.name || 'Unknown'} ({l.userId?.email || '—'}) {l.ipAddress ? `· ${l.ipAddress}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
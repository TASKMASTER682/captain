'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { UserCog, Shield, Trash2, ArrowLeft, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleRole = async (u: any) => {
    const newRole = u.role === 'Super Admin' ? 'User' : 'Super Admin';
    if (!confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    try {
      await api.put(`/users/${u._id}`, { role: newRole });
      await loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (u: any) => {
    try {
      await api.put(`/users/${u._id}`, { active: !u.active });
      await loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await api.delete(`/users/${id}`); await loadUsers(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80"><ArrowLeft className="w-4 h-4" /></Link>
          <UserCog className="w-5 h-5 text-rose-500" />
          <h1 className="font-bold text-lg font-outfit">User Management</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map(u => (
              <div key={u._id} className={`p-6 rounded-3xl border bg-card flex items-center justify-between transition-all ${!u.active ? 'border-rose-500/20 bg-rose-500/5 opacity-60' : 'border-border'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${u.role === 'Super Admin' ? 'bg-rose-500' : 'bg-primary'}`}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'Super Admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                        <Shield className="w-3 h-3 inline mr-0.5" />{u.role}
                      </span>
                      {!u.active && <span className="text-[10px] text-rose-500 font-bold">Suspended</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleRole(u)} className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors" title="Toggle role">
                    <Shield className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(u)} className={`p-2 rounded-xl transition-colors ${u.active ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`} title={u.active ? 'Suspend' : 'Activate'}>
                    {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(u._id)} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

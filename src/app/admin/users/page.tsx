'use client';

import React, { useState, useEffect } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { UserCog, Shield, Trash2, ArrowLeft, UserCheck, UserX, KeyRound, LogOut, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [resetFor, setResetFor] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);

  const ALL_ROLES = ['User', 'Content Manager', 'Support', 'Super Admin'];

  const roleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-rose-500/10 text-rose-500';
      case 'Content Manager': return 'bg-amber-500/10 text-amber-500';
      case 'Support': return 'bg-sky-500/10 text-sky-500';
      default: return 'bg-primary/10 text-primary';
    }
  };

  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const changeRole = async (u: any, newRole: string) => {
    setRoleMenuFor(null);
    if (newRole === u.role) return;
    if (!confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${u._id}`, { role: newRole });
      await loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (u: any) => {
    try {
      await api.put(`/admin/users/${u._id}`, { active: !u.active });
      await loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const forceLogout = async (u: any) => {
    if (!confirm(`Force logout ${u.name} from all devices?`)) return;
    try {
      await api.post(`/admin/users/${u._id}/force-logout`, {});
      alert('User logged out from all devices.');
    } catch (err: any) { alert(err.message); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }
    try {
      await api.post(`/admin/users/${resetFor._id}/reset-password`, { newPassword });
      setResetFor(null);
      setNewPassword('');
      alert('Password reset successfully.');
    } catch (err: any) { alert(err.message); }
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button onClick={loadUsers} className="px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90">Search</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map(u => (
              <div key={u._id} className={`p-6 rounded-3xl border bg-card flex items-center justify-between transition-all ${!u.active ? 'border-rose-500/20 bg-rose-500/5 opacity-60' : 'border-border'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${u.role === 'Super Admin' ? 'bg-rose-500' : u.role === 'Content Manager' ? 'bg-amber-500' : u.role === 'Support' ? 'bg-sky-500' : 'bg-primary'}`}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge(u.role)}`}>
                        <Shield className="w-3 h-3 inline mr-0.5" />{u.role}
                      </span>
                      {!u.active && <span className="text-[10px] text-rose-500 font-bold">Suspended</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {u.subscription?.status === 'active' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Premium {u.subscription.expiresAt ? `till ${new Date(u.subscription.expiresAt).toLocaleDateString()}` : ''}</span>
                      )}
                      {u.referralCode && <span className="text-[10px] text-muted-foreground">Ref: {u.referralCode}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="relative">
                    <button onClick={() => setRoleMenuFor(roleMenuFor === u._id ? null : u._id)} className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1" title="Change role">
                      <Shield className="w-4 h-4" /> <ChevronDown className="w-3 h-3" />
                    </button>
                    {roleMenuFor === u._id && (
                      <div className="absolute right-0 z-50 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl p-1">
                        {ALL_ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => changeRole(u, r)}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${r === u.role ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                          >{r}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleActive(u)} className={`p-2 rounded-xl transition-colors ${u.active ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`} title={u.active ? 'Suspend' : 'Activate'}>
                    {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setResetFor(u); setNewPassword(''); }} className="p-2 rounded-xl bg-secondary text-primary hover:bg-primary hover:text-white transition-colors" title="Reset password">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => forceLogout(u)} className="p-2 rounded-xl bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white transition-colors" title="Force logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this user permanently?')) { api.delete(`/users/${u._id}`).then(loadUsers).catch((err: any) => alert(err.message)); } }} className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {resetFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold font-outfit">Reset Password</h3>
            <p className="text-xs text-muted-foreground">Set a new password for <span className="font-semibold text-foreground">{resetFor.name}</span> ({resetFor.email})</p>
            <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
              className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-2">
              <button onClick={() => setResetFor(null)} className="flex-1 py-3 rounded-xl bg-secondary text-sm font-semibold hover:bg-secondary/80">Cancel</button>
              <button onClick={handleResetPassword} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90">Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

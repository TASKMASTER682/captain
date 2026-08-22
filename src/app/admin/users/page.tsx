'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getAuthUser } from '@/lib/api';
import {
  UserCog, Shield, Trash2, ArrowLeft, UserCheck, UserX, KeyRound, LogOut,
  Search, ChevronDown, ChevronLeft, ChevronRight, Users, Crown, Sparkles, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALL_ROLES = ['User', 'Content Manager', 'Support', 'Super Admin'];
const STAFF_ROLES = ['Super Admin', 'Content Manager', 'Support'];

const roleBadge = (role: string) => {
  switch (role) {
    case 'Super Admin': return 'bg-rose-500/10 text-rose-500';
    case 'Content Manager': return 'bg-amber-500/10 text-amber-500';
    case 'Support': return 'bg-sky-500/10 text-sky-500';
    default: return 'bg-primary/10 text-primary';
  }
};

const roleAvatar = (role: string) => {
  switch (role) {
    case 'Super Admin': return 'bg-rose-500';
    case 'Content Manager': return 'bg-amber-500';
    case 'Support': return 'bg-sky-500';
    default: return 'bg-primary';
  }
};

export default function UserManagement() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [resetFor, setResetFor] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Auth gate
  useEffect(() => {
    const user = getAuthUser();
    if (!user || user.role !== 'Super Admin') { router.push('/login'); return; }
    setMe(user);
  }, [router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debounced) params.set('q', debounced);
      if (roleFilter !== 'All') params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err: any) { showToast(err.message, false); }
    setLoading(false);
  }, [debounced, roleFilter, page]);

  useEffect(() => { if (me) loadUsers(); }, [me, loadUsers]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/users/stats');
      setStats(res.data || null);
    } catch (_e) {}
  }, []);

  useEffect(() => { if (me) loadStats(); }, [me, loadStats]);

  // Close role dropdown on outside click
  useEffect(() => {
    const close = () => setRoleMenuFor(null);
    if (roleMenuFor) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [roleMenuFor]);

  const isSelf = (u: any) => me && u._id === me._id;
  const isOtherSuper = (u: any) => u.role === 'Super Admin' && !isSelf(u);

  const changeRole = async (u: any, newRole: string) => {
    setRoleMenuFor(null);
    if (newRole === u.role) return;
    if (isSelf(u)) { showToast('You cannot change your own role.', false); return; }
    if (isOtherSuper(u)) { showToast('Cannot change the role of another Super Admin.', false); return; }
    if (!confirm(`Change ${u.name}'s role from ${u.role} to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${u._id}`, { role: newRole });
      showToast(`${u.name} is now ${newRole}.`);
      loadUsers(); loadStats();
    } catch (err: any) { showToast(err.message, false); }
  };

  const toggleActive = async (u: any) => {
    if (isSelf(u)) { showToast('You cannot suspend your own account.', false); return; }
    if (isOtherSuper(u)) { showToast('Cannot suspend another Super Admin.', false); return; }
    try {
      await api.put(`/admin/users/${u._id}`, { active: !u.active });
      showToast(u.active ? `${u.name} suspended.` : `${u.name} re-activated.`);
      loadUsers(); loadStats();
    } catch (err: any) { showToast(err.message, false); }
  };

  const forceLogout = async (u: any) => {
    if (!confirm(`Force logout ${u.name} from all devices?`)) return;
    try {
      await api.post(`/admin/users/${u._id}/force-logout`, {});
      showToast(`${u.name} logged out from all devices.`);
    } catch (err: any) { showToast(err.message, false); }
  };

  const deleteUser = async (u: any) => {
    if (isSelf(u)) { showToast('You cannot delete your own account.', false); return; }
    if (isOtherSuper(u)) { showToast('Cannot delete another Super Admin.', false); return; }
    if (!confirm(`Delete ${u.name} (${u.email}) permanently? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      showToast('User deleted.');
      loadUsers(); loadStats();
    } catch (err: any) { showToast(err.message, false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters.', false); return; }
    if (!adminPassword) { showToast('Re-enter your admin password to confirm.', false); return; }
    try {
      await api.post(`/admin/users/${resetFor._id}/reset-password`, { newPassword, adminPassword });
      setResetFor(null);
      setNewPassword(''); setAdminPassword('');
      showToast('Password reset successfully.');
    } catch (err: any) { showToast(err.message, false); }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.total ?? '—', icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Staff', value: stats?.staff ?? '—', icon: Crown, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Premium', value: stats?.premium ?? '—', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Suspended', value: stats?.suspended ?? '—', icon: UserX, color: 'text-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/dashboard" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
          <UserCog className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-lg font-outfit leading-tight">User Management</h1>
            <p className="text-[10px] text-muted-foreground">Roles &amp; access control</p>
          </div>
        </div>
        <Link href="/admin/audit-logs" className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 shrink-0 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Audit Logs</span>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <div className="text-lg font-bold font-outfit leading-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground truncate">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex flex-wrap gap-2">
          {['All', ...ALL_ROLES].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                roleFilter === r ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'All' ? 'All Roles' : r}
              {r !== 'All' && stats?.byRole && (
                <span className="ml-1.5 opacity-70">{stats.byRole[r] || 0}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-sm">No users match this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => {
              const self = isSelf(u);
              const lockedSuper = isOtherSuper(u);
              return (
                <div key={u._id} className={`p-4 sm:p-5 rounded-3xl border bg-card transition-all ${!u.active ? 'border-rose-500/20 bg-rose-500/5 opacity-70' : 'border-border'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${roleAvatar(u.role)}`}>
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate max-w-[180px] sm:max-w-none">{u.name}</span>
                          {self && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white">(You)</span>}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge(u.role)}`}>
                            <Shield className="w-3 h-3 inline mr-0.5" />{u.role}
                          </span>
                          {!u.active && <span className="text-[10px] text-rose-500 font-bold">Suspended</span>}
                        </div>
                        <span className="text-xs text-muted-foreground block truncate">{u.email}</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {u.subscription?.status === 'active' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Premium {u.subscription.expiresAt ? `till ${new Date(u.subscription.expiresAt).toLocaleDateString()}` : ''}</span>
                          )}
                          {u.referralCode && <span className="text-[10px] text-muted-foreground">Ref: {u.referralCode}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center sm:items-start flex-wrap">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => !self && !lockedSuper && setRoleMenuFor(roleMenuFor === u._id ? null : u._id)}
                          disabled={self || lockedSuper}
                          title={self ? "You can't change your own role" : lockedSuper ? "Another Super Admin's role is locked" : 'Change role'}
                          className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Shield className="w-4 h-4" /> Role <ChevronDown className="w-3 h-3" />
                        </button>
                        {roleMenuFor === u._id && (
                          <div className="absolute right-0 z-50 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl p-1">
                            <p className="px-3 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Set role</p>
                            {ALL_ROLES.map((r) => (
                              <button
                                key={r}
                                onClick={() => changeRole(u, r)}
                                disabled={r === u.role}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors flex items-center justify-between ${r === u.role ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                              >
                                {r}
                                {r === u.role && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleActive(u)}
                        disabled={self || lockedSuper}
                        title={self ? "You can't suspend yourself" : lockedSuper ? 'Protected account' : u.active ? 'Suspend' : 'Activate'}
                        className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${u.active ? 'bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                      >
                        {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button onClick={() => { setResetFor(u); setNewPassword(''); setAdminPassword(''); }} className="p-2 rounded-xl bg-secondary text-primary hover:bg-primary hover:text-white transition-colors" title="Reset password">
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button onClick={() => forceLogout(u)} className="p-2 rounded-xl bg-secondary text-amber-500 hover:bg-amber-500 hover:text-white transition-colors" title="Force logout from all devices">
                        <LogOut className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteUser(u)}
                        disabled={self || lockedSuper}
                        title={self ? "You can't delete yourself" : lockedSuper ? 'Protected account' : 'Delete user'}
                        className="p-2 rounded-xl bg-secondary text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-secondary text-xs font-bold hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-xs text-muted-foreground font-semibold">Page {page} of {pages} · {total} users</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              disabled={page >= pages}
              className="px-4 py-2 rounded-xl bg-secondary text-xs font-bold hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>

      {/* Reset password modal */}
      {resetFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold font-outfit">Reset Password</h3>
            <p className="text-xs text-muted-foreground">Set a new password for <span className="font-semibold text-foreground">{resetFor.name}</span> ({resetFor.email})</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
              className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Your admin password (confirm action)"
              className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-2">
              <button onClick={() => setResetFor(null)} className="flex-1 py-3 rounded-xl bg-secondary text-sm font-semibold hover:bg-secondary/80">Cancel</button>
              <button onClick={handleResetPassword} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

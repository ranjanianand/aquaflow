'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { UserPlus, ShieldAlert, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsers } from '@/lib/api/hooks';

/**
 * Accounts on this system.
 *
 * These are ours, not the client's — nobody sends a users table. The previous
 * version listed invented people with invented last-login times; this reads
 * the app_users table, which currently holds the one real account.
 *
 * `canSignIn` is false for every row because authentication is still a
 * hardcoded credential pair in the frontend. That is stated on screen rather
 * than hidden: an account nobody can actually use is worth showing as exactly
 * that.
 */
const ROLE_STYLE: Record<string, string> = {
  admin: 'text-purple-700 bg-purple-50 border-purple-300',
  manager: 'text-blue-700 bg-blue-50 border-blue-300',
  operator: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  viewer: 'text-slate-600 bg-slate-50 border-slate-300',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const { data, error, loading } = useUsers();

  const users = (data ?? []).filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const noAuth = (data ?? []).some((u) => !u.canSignIn);

  return (
    <div className="min-h-screen">
      <Header title="Users" subtitle="Accounts and roles on this system" />

      <div className="p-6 space-y-5">
        {noAuth && (
          <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5">
            <p className="text-xs text-amber-900">
              <ShieldAlert className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              <span className="font-bold">Sign-in is not wired to these accounts.</span>{' '}
              Authentication currently checks a fixed credential pair in the
              application, not this table. Adding a user here does not yet grant
              access.
            </p>
          </div>
        )}

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-800">{error.message}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 bg-white
                         focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Deliberately disabled: creating a user needs a password flow, and
              there is no authentication to attach one to yet. A button that
              opens a form and cannot complete it is worse than one that says
              why it is unavailable. */}
          <button
            disabled
            title="Available once authentication is wired to this table"
            className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold
                       border border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add user
          </button>
        </div>

        <div className="border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">Email</th>
                <th className="text-left px-4 py-2 font-semibold">Role</th>
                <th className="text-left px-4 py-2 font-semibold">Plants</th>
                <th className="text-left px-4 py-2 font-semibold">Last sign-in</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('px-2 py-0.5 border text-[10px] font-bold uppercase',
                                        ROLE_STYLE[u.role])}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {u.plants.length ? u.plants.join(', ') : 'All plants'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('text-xs font-semibold',
                      u.status === 'active' ? 'text-emerald-600' : 'text-slate-400')}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    {search ? 'No users match that search' : 'No accounts yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

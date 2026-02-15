import Link from 'next/link';
import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? 'all';
  const res = await serverFetch(`/api/admin/users?status=${status}&limit=50`);
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; email: string; role: string; is_active: boolean; is_verified: boolean }>; stats: { active: number; banned: number; unverified: number }; errors?: Record<string, string[]> }>(res);
  const users = payload?.data ?? [];
  const stats = payload?.stats ?? { active: 0, banned: 0, unverified: 0 };
  const hasApiError = !res.ok || !payload?.ok;

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">User Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-slate-300">
          Active: {stats.active} · Banned: {stats.banned} · Unverified: {stats.unverified}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/users?status=all" className="rounded-full border border-white/10 px-4 py-1">
          All users
        </Link>
        <Link href="/admin/users?status=active" className="rounded-full border border-white/10 px-4 py-1">
          Active
        </Link>
        <Link href="/admin/users?status=banned" className="rounded-full border border-white/10 px-4 py-1">
          Banned
        </Link>
        <Link href="/admin/users?status=unverified" className="rounded-full border border-white/10 px-4 py-1">
          Unverified
        </Link>
        <Link href="/admin/users/create" className="rounded-full border border-white/10 px-4 py-1">
          Create user
        </Link>
        <Link href="/admin/users/activity-log" className="rounded-full border border-white/10 px-4 py-1">
          Activity log
        </Link>
        <form action="/api/admin/users/export" method="GET" className="flex flex-wrap items-center gap-2">
          <select name="status" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="unverified">Unverified</option>
          </select>
          <input name="start" type="date" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" />
          <input name="end" type="date" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" />
          <button className="rounded-full border border-white/10 px-4 py-1 text-xs">Export CSV</button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {hasApiError && (
          <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <p className="font-semibold">User API is not available.</p>
            <p className="mt-1 text-rose-100/90">Status: {res.status}. Check DB connection and admin session.</p>
          </div>
        )}
        <div className="grid gap-3 text-sm text-slate-300">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-white">{user.email}</p>
                <p className="text-xs text-slate-400">{user.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">{user.is_active ? 'Active' : 'Banned'}</span>
                <span className="text-xs">{user.is_verified ? 'Verified' : 'Unverified'}</span>
                <Link href={`/admin/users/${user.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  Edit
                </Link>
                <Link href={`/admin/users/${user.id}/funds`} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  Adjust balance
                </Link>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">No users found</p>
              <p className="mt-1 text-xs text-slate-400">Create a user now to start managing accounts.</p>
              <form action="/api/admin/users" method="POST" className="mt-3 grid gap-2 md:grid-cols-4">
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="newuser@saas.local"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                />
                <input
                  name="password"
                  required
                  minLength={8}
                  placeholder="Password123!"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                />
                <select name="role" defaultValue="USER" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white">
                  <option value="USER">USER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                  Create user
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

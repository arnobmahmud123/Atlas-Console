import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminUsersActivityLogPage() {
  const res = await serverFetch('/api/admin/users/activity-log');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; type: string; created_at: string; User?: { email: string | null } }> }>(res);
  const logs = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">User Activity</p>
        <h1 className="mt-2 text-2xl font-semibold">Activity log</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{log.User?.email ?? 'User'}</span>
              <span>{log.type}</span>
              <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
          {logs.length === 0 && <p>No activity yet.</p>}
        </div>
      </div>
    </div>
  );
}

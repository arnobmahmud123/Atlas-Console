import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminActivityPage() {
  const res = await serverFetch('/api/admin/activity');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; action: string; amount: string | null; reference_id: string | null; created_at: string }> }>(res);
  const logs = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Admin Activity</p>
        <h1 className="mt-2 text-2xl font-semibold">Audit log</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{log.action}</span>
              <span>{log.amount ? `$${log.amount}` : '-'}</span>
              <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
          {logs.length === 0 && <p>No audit events.</p>}
        </div>
      </div>
    </div>
  );
}

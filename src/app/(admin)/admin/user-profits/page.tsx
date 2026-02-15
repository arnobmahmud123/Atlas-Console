import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminUserProfitsPage() {
  const res = await serverFetch('/api/admin/user-profits');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; amount: string; created_at: string; User?: { email: string | null } }> }>(res);
  const profits = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">User Profits</p>
        <h1 className="mt-2 text-2xl font-semibold">All profit payouts</h1>
        <p className="mt-2 text-sm text-slate-300">Track daily ROI distributions.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {profits.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{item.User?.email ?? 'User'}</span>
              <span>${item.amount.toString()}</span>
              <span className="text-xs text-slate-400">{new Date(item.created_at).toDateString()}</span>
            </div>
          ))}
          {profits.length === 0 && <p>No profits found.</p>}
        </div>
      </div>
    </div>
  );
}

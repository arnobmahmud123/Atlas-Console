import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function UsersReportPage() {
  const res = await serverFetch('/api/admin/reports/users');
  const payload = await safeJson<{ ok: boolean; data: { total: number; active: number; growth7d: number[] } }>(res);
  const data = payload?.data ?? { total: 0, active: 0, growth7d: [] };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Reports & Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold">User growth report</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">Total users</p>
          <p className="mt-2 text-2xl font-semibold">{data.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">Active users</p>
          <p className="mt-2 text-2xl font-semibold">{data.active}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Daily signups (7 days)</h2>
        <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
          {data.growth7d.map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-20 w-3 rounded-full bg-blue-300/30">
                <div className="h-full w-full rounded-full bg-blue-300" style={{ height: `${Math.min(100, value * 10)}%` }} />
              </div>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

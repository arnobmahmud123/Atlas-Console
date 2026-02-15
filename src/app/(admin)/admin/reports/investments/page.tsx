import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function InvestmentReportsPage() {
  const res = await serverFetch('/api/admin/reports/investments');
  const payload = await safeJson<{ ok: boolean; data: { totalActive: { _sum: { invested_amount: string | null } }; planCounts: Array<{ plan_id: string; _count: { id: number } }>; plans: Array<{ id: string; name: string }> } }>(res);
  const data = payload?.data ?? { totalActive: { _sum: { invested_amount: '0' } }, planCounts: [], plans: [] };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Reports & Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold">Investment report</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-slate-400">Total active investment amount</p>
        <p className="mt-2 text-2xl font-semibold">${data.totalActive._sum.invested_amount ?? '0'}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Users per plan</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.planCounts.map(item => {
            const plan = data.plans.find(p => p.id === item.plan_id);
            return (
              <div key={item.plan_id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>{plan?.name ?? 'Plan'}</span>
                <span>{item._count.id}</span>
              </div>
            );
          })}
          {data.planCounts.length === 0 && <p>No investment data.</p>}
        </div>
      </div>
    </div>
  );
}

import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function CompletedInvestmentsPage() {
  const res = await serverFetch('/api/admin/investments?status=COMPLETED');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; invested_amount: string; status: string; User?: { email: string | null }; InvestmentPlan?: { name: string | null } }> }>(res);
  const investments = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investments</p>
        <h1 className="mt-2 text-2xl font-semibold">Completed investments</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint */}
        <a href="/api/admin/investments/export?status=COMPLETED" className="mt-3 inline-block rounded-full border border-white/10 px-4 py-1 text-sm">Export CSV</a>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {investments.map(inv => (
          <div key={inv.id} className="flex items-center justify-between border-b border-white/5 pb-2">
            <span>{inv.User?.email ?? 'User'}</span>
            <span>${inv.invested_amount.toString()}</span>
            <span className="text-xs text-slate-400">{inv.InvestmentPlan?.name ?? 'Plan'}</span>
            <form action={`/api/admin/investments/${inv.id}/credit`} method="POST" className="flex items-center gap-2">
              <button className="rounded-full border border-white/10 px-3 py-1 text-xs">Credit profit</button>
            </form>
          </div>
        ))}
        {investments.length === 0 && <p>No completed investments.</p>}
      </div>
    </div>
  );
}

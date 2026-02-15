import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AllInvestmentsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; email?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? '';
  const email = sp.email ?? '';
  const start = sp.start ?? '';
  const end = sp.end ?? '';

  const res = await serverFetch(`/api/admin/investments?status=${status}&email=${encodeURIComponent(email)}&start=${start}&end=${end}`);
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; invested_amount: string; status: string; User?: { email: string | null }; InvestmentPlan?: { name: string | null } }> }>(res);
  const investments = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investments</p>
        <h1 className="mt-2 text-2xl font-semibold">All investments</h1>
        <form action="/admin/investments/all" method="GET" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input name="email" defaultValue={email} placeholder="User email" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <select name="status" defaultValue={status} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
            <option value="">All status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input name="start" type="date" defaultValue={start} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="end" type="date" defaultValue={end} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1">Filter</button>
          <a
            href={`/api/admin/investments/export?status=${status}&email=${email}&start=${start}&end=${end}`}
            className="rounded-full border border-white/10 px-3 py-1"
          >
            Export CSV
          </a>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {investments.map(inv => (
          <div key={inv.id} className="flex items-center justify-between border-b border-white/5 pb-2">
            <span>{inv.User?.email ?? 'User'}</span>
            <span>${inv.invested_amount.toString()}</span>
            <span className="text-xs text-slate-400">{inv.InvestmentPlan?.name ?? 'Plan'}</span>
            <span className="text-xs">{inv.status}</span>
          </div>
        ))}
        {investments.length === 0 && <p>No investments found.</p>}
      </div>
    </div>
  );
}

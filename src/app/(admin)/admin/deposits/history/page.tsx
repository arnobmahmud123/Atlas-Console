import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminDepositsHistoryPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; email?: string; start?: string; end?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? '';
  const email = sp.email ?? '';
  const start = sp.start ?? '';
  const end = sp.end ?? '';
  const sort = sp.sort ?? 'created_at';
  const dir = sp.dir === 'asc' ? 'asc' : 'desc';

  const res = await serverFetch(`/api/admin/deposits?status=${status}&email=${encodeURIComponent(email)}&start=${start}&end=${end}`);
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; payment_method: string; status: string; amount: string; created_at: string; User?: { email: string | null } }> }>(res);
  const deposits = payload?.data ?? [];

  const toggleDir = (field: string) => (sort === field && dir === 'asc' ? 'desc' : 'asc');
  const baseQuery = `status=${status}&email=${encodeURIComponent(email)}&start=${start}&end=${end}`;

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Deposits</p>
        <h1 className="mt-2 text-2xl font-semibold">Deposit history</h1>
        <form action="/admin/deposits/history" method="GET" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <select name="status" defaultValue={status} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
            <option value="">All status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
          <input name="email" defaultValue={email} placeholder="User email" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="start" type="date" defaultValue={start} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="end" type="date" defaultValue={end} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1">Filter</button>
          <a
            href={`/api/admin/deposits/export?status=${status}&email=${email}&start=${start}&end=${end}`}
            className="rounded-full border border-white/10 px-3 py-1"
          >
            Export CSV
          </a>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <div className="overflow-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">
                  <a href={`/admin/deposits/history?${baseQuery}&sort=amount&dir=${toggleDir('amount')}`}>Amount</a>
                </th>
                <th className="px-3 py-2 text-left">
                  <a href={`/admin/deposits/history?${baseQuery}&sort=status&dir=${toggleDir('status')}`}>Status</a>
                </th>
                <th className="px-3 py-2 text-left">
                  <a href={`/admin/deposits/history?${baseQuery}&sort=created_at&dir=${toggleDir('created_at')}`}>Date</a>
                </th>
              </tr>
            </thead>
            <tbody>
              {deposits.map(dep => {
                const statusClass =
                  dep.status === 'SUCCESS'
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : dep.status === 'FAILED'
                    ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
                const statusTooltip =
                  dep.status === 'SUCCESS' ? 'Deposit confirmed' : dep.status === 'FAILED' ? 'Deposit failed' : 'Awaiting confirmation';
                return (
                  <tr key={dep.id} className="rounded-2xl border border-white/10 bg-white/5">
                    <td className="px-3 py-3 text-white">{dep.User?.email ?? 'User'}</td>
                    <td className="px-3 py-3">{dep.payment_method}</td>
                    <td className="px-3 py-3">${dep.amount.toString()}</td>
                    <td className="px-3 py-3">
                      <span title={statusTooltip} className={`rounded-full border px-3 py-1 text-xs ${statusClass}`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{new Date(dep.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {deposits.length === 0 && <p className="mt-3">No deposits yet.</p>}
      </div>
    </div>
  );
}

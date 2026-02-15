import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminWithdrawalsHistoryPage({
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

  const res = await serverFetch(`/api/admin/withdrawals?status=${status}&email=${encodeURIComponent(email)}&start=${start}&end=${end}`);
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; withdraw_method: string; status: string; amount: string; created_at: string; User_Withdrawal_user_idToUser?: { email: string | null } }> }>(res);
  const withdrawals = payload?.data ?? [];

  const toggleDir = (field: string) => (sort === field && dir === 'asc' ? 'desc' : 'asc');
  const baseQuery = `status=${status}&email=${encodeURIComponent(email)}&start=${start}&end=${end}`;

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Withdrawals</p>
        <h1 className="mt-2 text-2xl font-semibold">Withdrawal history</h1>
        <form action="/admin/withdrawals/history" method="GET" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <select name="status" defaultValue={status} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
            <option value="">All status</option>
            <option value="PAID">PAID</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input name="email" defaultValue={email} placeholder="User email" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="start" type="date" defaultValue={start} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="end" type="date" defaultValue={end} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1">Filter</button>
          <a
            href={`/api/admin/withdrawals/export?status=${status}&email=${email}&start=${start}&end=${end}`}
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
                  <a href={`/admin/withdrawals/history?${baseQuery}&sort=amount&dir=${toggleDir('amount')}`}>Amount</a>
                </th>
                <th className="px-3 py-2 text-left">
                  <a href={`/admin/withdrawals/history?${baseQuery}&sort=status&dir=${toggleDir('status')}`}>Status</a>
                </th>
                <th className="px-3 py-2 text-left">
                  <a href={`/admin/withdrawals/history?${baseQuery}&sort=created_at&dir=${toggleDir('created_at')}`}>Date</a>
                </th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(wd => {
                const statusClass =
                  wd.status === 'PAID'
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : wd.status === 'REJECTED'
                    ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
                const statusTooltip =
                  wd.status === 'PAID' ? 'Withdrawal paid' : wd.status === 'REJECTED' ? 'Withdrawal rejected' : 'Pending review';
                return (
                  <tr key={wd.id} className="rounded-2xl border border-white/10 bg-white/5">
                    <td className="px-3 py-3 text-white">{wd.User_Withdrawal_user_idToUser?.email ?? 'User'}</td>
                    <td className="px-3 py-3">{wd.withdraw_method}</td>
                    <td className="px-3 py-3">${wd.amount.toString()}</td>
                    <td className="px-3 py-3">
                      <span title={statusTooltip} className={`rounded-full border px-3 py-1 text-xs ${statusClass}`}>
                        {wd.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{new Date(wd.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {withdrawals.length === 0 && <p className="mt-3">No withdrawals yet.</p>}
      </div>
    </div>
  );
}

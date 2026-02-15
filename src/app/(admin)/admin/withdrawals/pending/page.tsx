import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { AdminWithdrawalActions } from '@/ui/components/admin-withdrawal-actions';
import Link from 'next/link';

export default async function AdminWithdrawalsPendingPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email ?? '';
  const start = sp.start ?? '';
  const end = sp.end ?? '';
  const [res, manualAcctRes, manualAdminRes] = await Promise.all([
    serverFetch(`/api/admin/withdrawals?status=PENDING&email=${encodeURIComponent(email)}&start=${start}&end=${end}`),
    serverFetch(`/api/accountant/withdrawal-requests?status=PENDING_ACCOUNTANT`),
    serverFetch(`/api/admin/withdrawal-requests?status=PENDING_ADMIN_FINAL`)
  ]);

  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; withdraw_method: string; status: string; amount: string; User_Withdrawal_user_idToUser?: { email: string | null } }> }>(res);
  const manualAcct = await safeJson<{ ok: boolean; data: Array<{ id: string; method: string; amount: string; payout_number: string; User?: { email: string | null } }> }>(manualAcctRes);
  const manualAdmin = await safeJson<{ ok: boolean; data: Array<{ id: string; method: string; amount: string; payout_number: string; User?: { email: string | null } }> }>(manualAdminRes);

  const withdrawals = payload?.data ?? [];
  const pendingManualAccountant = manualAcct?.data ?? [];
  const pendingManualAdmin = manualAdmin?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Withdrawals</p>
        <h1 className="mt-2 text-2xl font-semibold">Pending withdrawals</h1>
        <form action="/admin/withdrawals/pending" method="GET" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input name="email" defaultValue={email} placeholder="User email" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="start" type="date" defaultValue={start} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="end" type="date" defaultValue={end} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1">Filter</button>
          <a
            href={`/api/admin/withdrawals/export?status=PENDING&email=${email}&start=${start}&end=${end}`}
            className="rounded-full border border-white/10 px-3 py-1"
          >
            Export CSV
          </a>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Manual mobile withdrawals awaiting accountant</p>
          <p className="mt-2 text-3xl font-semibold">{pendingManualAccountant.length}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/accountant/withdrawals" className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">
              Open accountant queue
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Manual mobile withdrawals awaiting admin final</p>
          <p className="mt-2 text-3xl font-semibold">{pendingManualAdmin.length}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/manual-approvals/withdrawals" className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">
              Finalize approvals
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {withdrawals.map(wd => (
          <div key={wd.id} className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <p className="text-white">{wd.User_Withdrawal_user_idToUser?.email ?? 'User'}</p>
              <p className="text-xs text-slate-400">{wd.withdraw_method} · {wd.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <span>${wd.amount.toString()}</span>
              <AdminWithdrawalActions withdrawalId={wd.id} />
            </div>
          </div>
        ))}
        {withdrawals.length === 0 && pendingManualAccountant.length === 0 && pendingManualAdmin.length === 0 && <p>No pending withdrawals.</p>}
      </div>
    </div>
  );
}

import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AccountantDashboardPage() {
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  try {
    const [depsRes, wdsRes] = await Promise.all([
      serverFetch('/api/accountant/deposit-requests?status=PENDING_ACCOUNTANT'),
      serverFetch('/api/accountant/withdrawal-requests?status=PENDING_ACCOUNTANT')
    ]);
    const deps = await safeJson<{ ok: boolean; data: any[] }>(depsRes);
    const wds = await safeJson<{ ok: boolean; data: any[] }>(wdsRes);
    pendingDeposits = deps?.data?.length ?? 0;
    pendingWithdrawals = wds?.data?.length ?? 0;
  } catch (error) {
    console.error('[accountant/dashboard] failed to load queue', error);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Queue</p>
        <h1 className="mt-2 text-2xl font-semibold">Accountant dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">Review deposit and withdrawal requests before admin finalization.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-slate-400">Pending deposits</p>
          <p className="mt-2 text-3xl font-semibold">{pendingDeposits}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-slate-400">Pending withdrawals</p>
          <p className="mt-2 text-3xl font-semibold">{pendingWithdrawals}</p>
        </div>
      </div>
    </div>
  );
}

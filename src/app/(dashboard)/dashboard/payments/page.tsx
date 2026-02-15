import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { PayoutSettings } from '@/ui/components/payout-settings';

export default async function PaymentsPage() {
  const depositsRes = await serverFetch('/api/deposits/create', { method: 'GET' });
  const withdrawalsRes = await serverFetch('/api/withdrawals/request', { method: 'GET' });

  const depositsPayload = await safeJson<{ ok: boolean; data: Array<{ id: string; payment_method: string; amount: string; created_at: string }> }>(depositsRes);
  const withdrawalsPayload = await safeJson<{ ok: boolean; data: Array<{ id: string; withdraw_method: string; amount: string; created_at: string }> }>(withdrawalsRes);

  const deposits = depositsPayload?.data ?? [];
  const withdrawals = withdrawalsPayload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Payments</p>
        <h1 className="mt-2 text-2xl font-semibold">Transactions</h1>
      </div>

      <PayoutSettings />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Deposits</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {deposits.map(dep => (
              <div key={dep.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <p className="text-white">{dep.payment_method}</p>
                  <p className="text-xs text-slate-400">{new Date(dep.created_at).toLocaleString()}</p>
                </div>
                <span>${dep.amount.toString()}</span>
              </div>
            ))}
            {deposits.length === 0 && <p>No deposits yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Withdrawals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {withdrawals.map(wd => (
              <div key={wd.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <p className="text-white">{wd.withdraw_method}</p>
                  <p className="text-xs text-slate-400">{new Date(wd.created_at).toLocaleString()}</p>
                </div>
                <span>${wd.amount.toString()}</span>
              </div>
            ))}
            {withdrawals.length === 0 && <p>No withdrawals yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

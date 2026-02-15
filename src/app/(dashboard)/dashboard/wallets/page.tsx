import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { WalletActions } from '@/ui/components/wallet-actions';
import { formatCompactUsd, toFullUsd } from '@/lib/format/currency';

export default async function WalletsPage() {
  const balanceRes = await serverFetch('/api/wallet/balance?walletType=MAIN');
  const depositsRes = await serverFetch('/api/deposits/create');
  const withdrawalsRes = await serverFetch('/api/withdrawals/request');

  const balancePayload = await safeJson<{ ok: boolean; balance: string }>(balanceRes);
  const depositsPayload = await safeJson<{ ok: boolean; data: Array<{ id: string; payment_method: string; amount: string }> }>(depositsRes);
  const withdrawalsPayload = await safeJson<{ ok: boolean; data: Array<{ id: string; withdraw_method: string; amount: string }> }>(withdrawalsRes);

  const balance = balancePayload?.balance ?? '0';
  const balanceError = !balanceRes.ok || !balancePayload?.ok;
  const deposits = depositsPayload?.data ?? [];
  const withdrawals = withdrawalsPayload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Wallets</p>
        <h1 className="mt-2 text-2xl font-semibold">Main wallet balance</h1>
        <p title={toFullUsd(balance)} className="mt-2 text-3xl font-semibold">
          {formatCompactUsd(balance)}
        </p>
        {balanceError && (
          <p className="mt-2 text-xs text-rose-300">Balance API unavailable. Check session/database connection.</p>
        )}
      </div>

      <WalletActions />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Recent deposits</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {deposits.map(dep => (
              <div key={dep.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>{dep.payment_method}</span>
                <span title={toFullUsd(dep.amount)}>{formatCompactUsd(dep.amount)}</span>
              </div>
            ))}
            {deposits.length === 0 && <p>No deposits yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Recent withdrawals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {withdrawals.map(wd => (
              <div key={wd.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>{wd.withdraw_method}</span>
                <span title={toFullUsd(wd.amount)}>{formatCompactUsd(wd.amount)}</span>
              </div>
            ))}
            {withdrawals.length === 0 && <p>No withdrawals yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

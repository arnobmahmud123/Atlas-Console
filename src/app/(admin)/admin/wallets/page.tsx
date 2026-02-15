import Link from 'next/link';
import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { getWalletBalance } from '@/services/wallet.service';
import { formatCompactUsd, toFullUsd } from '@/lib/format/currency';

export default async function AdminWalletsPage() {
  const res = await serverFetch('/api/admin/wallets');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; user_id: string; type: string; User?: { email: string | null } }> }>(res);
  const wallets = payload?.data ?? [];

  const balances = await Promise.all(wallets.map(w => getWalletBalance(w.user_id, w.type)));

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Wallet Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Wallets</h1>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/wallets/adjust" className="rounded-full border border-white/10 px-4 py-1">
          Adjust balance
        </Link>
        <Link href="/admin/wallets/transfer" className="rounded-full border border-white/10 px-4 py-1">
          Internal transfer
        </Link>
        <Link href="/admin/wallets/history" className="rounded-full border border-white/10 px-4 py-1">
          Ledger history
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {wallets.map((wallet, idx) => (
            <div key={wallet.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{wallet.User?.email ?? 'User'}</span>
              <span>{wallet.type}</span>
              <span title={toFullUsd(balances[idx]?.toString() ?? '0')}>
                {formatCompactUsd(balances[idx]?.toString() ?? '0')}
              </span>
            </div>
          ))}
          {wallets.length === 0 && <p>No wallets found.</p>}
        </div>
      </div>
    </div>
  );
}

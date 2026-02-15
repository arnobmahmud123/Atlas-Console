import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminWalletHistoryPage() {
  const res = await serverFetch('/api/admin/wallets/history');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; amount: string; direction: string; created_at: string; LedgerAccount?: { account_no: string | null }; User?: { email: string | null } }> }>(res);
  const entries = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Wallet History</p>
        <h1 className="mt-2 text-2xl font-semibold">Ledger entries</h1>
        <form action="/api/admin/wallets/history/export" method="GET" className="mt-3">
          <button className="rounded-full border border-white/10 px-4 py-1 text-sm">Export CSV</button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{entry.User?.email ?? 'User'}</span>
              <span>{entry.LedgerAccount?.account_no ?? 'Account'}</span>
              <span>{entry.direction}</span>
              <span>${entry.amount.toString()}</span>
              <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          ))}
          {entries.length === 0 && <p>No ledger entries found.</p>}
        </div>
      </div>
    </div>
  );
}

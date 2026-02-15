import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import ReferralCommissionConfig from './referral-commission-config';

export default async function AdminReferralCommissionsPage() {
  const res = await serverFetch('/api/admin/referrals/earnings');
  const payload = await safeJson<{ ok: boolean; data: { levels: Array<{ level: number; percent: number }>; earningsRows: Array<{ user_id: string; email: string; total: string }> } }>(res);
  const levels = payload?.data.levels ?? [{ level: 1, percent: 5 }];
  const earningsRows = payload?.data.earningsRows ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Referral System</p>
        <h1 className="mt-2 text-2xl font-semibold">Commission configuration</h1>
      </div>

      <ReferralCommissionConfig initialLevels={levels} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Referral earnings by user</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {earningsRows.map(row => (
            <div key={row.user_id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{row.email}</span>
              <span>${row.total}</span>
            </div>
          ))}
          {earningsRows.length === 0 && <p>No referral earnings yet.</p>}
        </div>
      </div>
    </div>
  );
}

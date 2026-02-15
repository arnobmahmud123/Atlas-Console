import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminReferralTreePage() {
  const res = await serverFetch('/api/admin/referrals');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; level: number; User_Referral_user_idToUser?: { email: string | null }; User_Referral_parent_user_idToUser?: { email: string | null } }> }>(res);
  const refs = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Referrals</p>
        <h1 className="mt-2 text-2xl font-semibold">Referral tree</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {refs.map(ref => (
            <div key={ref.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>Level {ref.level}</span>
              <span>{ref.User_Referral_parent_user_idToUser?.email ?? 'Parent'}</span>
              <span>{ref.User_Referral_user_idToUser?.email ?? 'Child'}</span>
            </div>
          ))}
          {refs.length === 0 && <p>No referral data.</p>}
        </div>
      </div>
    </div>
  );
}

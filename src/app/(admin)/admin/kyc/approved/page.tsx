import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminKycApprovedPage() {
  const res = await serverFetch('/api/admin/kyc?status=APPROVED');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; document_type: string; created_at: string; User?: { email: string | null } }> }>(res);
  const kyc = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">KYC</p>
        <h1 className="mt-2 text-2xl font-semibold">Approved KYC</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {kyc.map(item => (
          <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <p className="text-white">{item.User?.email ?? 'User'}</p>
              <p className="text-xs text-slate-400">{item.document_type} · {new Date(item.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Approved</span>
          </div>
        ))}
        {kyc.length === 0 && <p>No approved KYC records.</p>}
      </div>
    </div>
  );
}

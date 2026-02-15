import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { AdminKycActions } from '@/ui/components/admin-kyc-actions';

export default async function AdminKycPendingPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const res = await serverFetch('/api/admin/kyc?status=PENDING');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; document_type: string; created_at: string; User?: { email: string | null } }> }>(res);
  const kyc = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">KYC</p>
        <h1 className="mt-2 text-2xl font-semibold">Pending verification</h1>
        <form action="/admin/kyc/pending" method="GET" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input name="email" defaultValue={sp.email} placeholder="User email" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="start" type="date" defaultValue={sp.start} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input name="end" type="date" defaultValue={sp.end} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1">Filter</button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {kyc.map(item => (
          <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <p className="text-white">{item.User?.email ?? 'User'}</p>
              <p className="text-xs text-slate-400">{item.document_type} · {new Date(item.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <AdminKycActions kycId={item.id} />
            </div>
          </div>
        ))}
        {kyc.length === 0 && <p>No pending KYC requests.</p>}
      </div>
    </div>
  );
}

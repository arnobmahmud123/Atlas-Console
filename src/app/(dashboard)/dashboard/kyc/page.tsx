import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { KycSubmitForm } from '@/ui/components/kyc-submit-form';

export default async function KycPage() {
  const res = await serverFetch('/api/kyc/submit');
  const payload = await safeJson<{ ok: boolean; data: { status?: string; document_type?: string; document_front_url?: string; document_back_url?: string | null; selfie_url?: string } | null }>(res);
  const record = payload?.data ?? null;

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">KYC</p>
        <h1 className="mt-2 text-2xl font-semibold">Verification status</h1>
        <p className="mt-2 text-sm text-slate-300">
          Current status:{' '}
          <span
            title={
              record?.status === 'APPROVED'
                ? 'Verified and approved'
                : record?.status === 'REJECTED'
                ? 'Rejected. Update documents.'
                : record?.status === 'PENDING'
                ? 'Awaiting review'
                : 'Not submitted yet'
            }
            className={`rounded-full border px-3 py-1 text-xs ${record?.status === 'APPROVED' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : record?.status === 'REJECTED' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}
          >
            {record?.status ?? 'NOT_SUBMITTED'}
          </span>
        </p>
        {record && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <a href={record.document_front_url ?? '#'} target="_blank" className="rounded-full border border-white/10 px-3 py-1">
              Document front
            </a>
            {record.document_back_url && (
              <a href={record.document_back_url} target="_blank" className="rounded-full border border-white/10 px-3 py-1">
                Document back
              </a>
            )}
            <a href={record.selfie_url ?? '#'} target="_blank" className="rounded-full border border-white/10 px-3 py-1">
              Selfie
            </a>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Submit verification</h2>
        <KycSubmitForm />
      </div>
    </div>
  );
}

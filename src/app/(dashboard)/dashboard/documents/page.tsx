import { serverFetch, safeJson } from '@/lib/http/server-fetch';

const labels: Record<string, string> = {
  BUSINESS_LICENSE: 'Business license',
  SHOP_LEASE: 'Shop lease document',
  TAX_FILE: 'Tax files',
  OTHER: 'Other documents'
};

export default async function DashboardDocumentsPage() {
  const res = await serverFetch('/api/documents');
  const payload = await safeJson<{
    ok: boolean;
    data: Array<{ id: string; title: string; category: string; file_url: string; notes?: string | null; created_at: string }>;
  }>(res);

  const rows = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Document Center</p>
        <h1 className="mt-2 text-2xl font-semibold">Company documents</h1>
        <p className="mt-2 text-sm text-slate-300">View-only access for investors.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {rows.map(row => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">{row.title}</p>
              <p className="mt-1 text-xs text-slate-400">{labels[row.category] ?? row.category} · {new Date(row.created_at).toLocaleString()}</p>
              {row.notes ? <p className="mt-2 text-xs text-slate-300">{row.notes}</p> : null}
              <a href={row.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyan-200 underline">View document</a>
            </div>
          ))}
          {rows.length === 0 ? <p>No documents available.</p> : null}
        </div>
      </div>
    </div>
  );
}

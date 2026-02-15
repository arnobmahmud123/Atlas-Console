import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function DashboardAnnouncementsPage() {
  const res = await serverFetch('/api/announcements');
  const payload = await safeJson<{
    ok: boolean;
    data: Array<{ id: string; title: string; message: string; type: 'GENERAL' | 'PROFIT_DELAY' | 'MAINTENANCE'; published_at: string; expires_at?: string | null }>;
  }>(res);

  const rows = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Announcement Board</p>
        <h1 className="mt-2 text-2xl font-semibold">Notices</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white">{r.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${r.type === 'MAINTENANCE' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : r.type === 'PROFIT_DELAY' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'}`}>
                  {r.type}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-300">{r.message}</p>
              <p className="mt-2 text-[11px] text-slate-500">{new Date(r.published_at).toLocaleString()}</p>
            </div>
          ))}
          {rows.length === 0 ? <p>No active announcements.</p> : null}
        </div>
      </div>
    </div>
  );
}

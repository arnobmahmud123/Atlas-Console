import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function DashboardNotificationsPage() {
  const res = await serverFetch('/api/notifications?limit=30');
  const payload = await safeJson<{
    ok: boolean;
    data: Array<{ id: string; type: string; title: string; message: string; read: boolean; created_at: string; attachment_url?: string | null }>;
    unreadCount: number;
  }>(res);

  const rows = payload?.data ?? [];
  const unread = payload?.unreadCount ?? 0;

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Inbox</p>
        <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-slate-300">Unread: {unread}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
        {rows.map(n => (
          <div key={n.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
            <div className="min-w-0">
              <p className="text-white font-semibold">
                {n.title}{' '}
                {!n.read ? <span className="ml-2 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-200">NEW</span> : null}
              </p>
              <p className="mt-1 text-xs text-slate-300">{n.message}</p>
              {n.attachment_url ? (
                <a href={n.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-200 underline">
                  View payment proof
                </a>
              ) : null}
              <p className="mt-2 text-[11px] text-slate-500">{new Date(n.created_at).toLocaleString()} · {n.type}</p>
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p>No notifications yet.</p> : null}
      </div>
    </div>
  );
}

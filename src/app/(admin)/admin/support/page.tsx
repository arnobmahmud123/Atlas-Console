import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { AdminSupportCenter, type AdminTicket } from '@/ui/components/admin-support-center';

export default async function AdminSupportPage() {
  const res = await serverFetch('/api/admin/support/tickets');
  const payload = await safeJson<{ ok: boolean; data: AdminTicket[] }>(res);
  const tickets = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Support</p>
        <h1 className="mt-2 text-2xl font-semibold">Ticket queue</h1>
        <p className="mt-2 text-sm text-slate-300">Reply to user tickets and track status changes.</p>
      </div>
      <AdminSupportCenter initialTickets={tickets} />
    </div>
  );
}

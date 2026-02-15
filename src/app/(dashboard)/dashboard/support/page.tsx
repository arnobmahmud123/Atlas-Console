import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { UserSupportCenter, type UserTicket } from '@/ui/components/user-support-center';

export default async function SupportPage() {
  const res = await serverFetch('/api/support/tickets');
  const payload = await safeJson<{ ok: boolean; data: UserTicket[] }>(res);
  const tickets = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Support</p>
        <h1 className="mt-2 text-2xl font-semibold">Help Desk</h1>
        <p className="mt-2 text-sm text-slate-300">Raise a ticket, get admin replies, and track status in one place.</p>
      </div>
      <UserSupportCenter initialTickets={tickets} />
    </div>
  );
}

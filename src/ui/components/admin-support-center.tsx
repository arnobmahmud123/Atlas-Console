'use client';

import { useMemo, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Reply = { id: string; message: string; is_admin: boolean; created_at: string; author?: { email?: string | null } };
export type AdminTicket = {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  User?: { email?: string | null };
  replies: Reply[];
};

const statuses: AdminTicket['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function AdminSupportCenter({ initialTickets }: { initialTickets: AdminTicket[] }) {
  const [tickets, setTickets] = useState<AdminTicket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminTicket['status']>('ALL');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string>('');

  async function reload(filter: 'ALL' | AdminTicket['status'] = statusFilter) {
    const qs = filter === 'ALL' ? '' : `?status=${filter}`;
    const res = await fetch(`/api/admin/support/tickets${qs}`, { cache: 'no-store' });
    const data = await safeJsonClient<{ ok: boolean; data: AdminTicket[] }>(res);
    setTickets(data?.data ?? []);
  }

  async function updateStatus(ticketId: string, status: AdminTicket['status']) {
    const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await safeJsonClient<{ ok: boolean; message?: string }>(res);
    if (!res.ok || !data?.ok) {
      setToast(data?.message ?? 'Failed to update status');
      return;
    }
    setToast('Status updated');
    await reload();
  }

  async function reply(ticketId: string) {
    const message = (replyText[ticketId] ?? '').trim();
    if (!message) return;
    const res = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await safeJsonClient<{ ok: boolean; message?: string }>(res);
    if (!res.ok || !data?.ok) {
      setToast(data?.message ?? 'Failed to send reply');
      return;
    }
    setReplyText(prev => ({ ...prev, [ticketId]: '' }));
    setToast('Reply sent');
    await reload();
  }

  const filtered = useMemo(
    () => tickets.filter(ticket => (statusFilter === 'ALL' ? true : ticket.status === statusFilter)),
    [tickets, statusFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-300">Filter</label>
        <select
          value={statusFilter}
          onChange={async e => {
            const next = e.target.value as 'ALL' | AdminTicket['status'];
            setStatusFilter(next);
            await reload(next);
          }}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
        >
          <option value="ALL">ALL</option>
          {statuses.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {filtered.map(ticket => (
        <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{ticket.subject}</p>
              <p className="text-sm text-slate-300">{ticket.User?.email ?? 'Unknown user'}</p>
              <p className="text-xs text-slate-400">Created: {new Date(ticket.created_at).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Updated: {new Date(ticket.updated_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ticket.status}
                onChange={e => updateStatus(ticket.id, e.target.value as AdminTicket['status'])}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-slate-300">{ticket.message}</p>
          <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
            {ticket.replies.map(reply => (
              <div key={reply.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
                <p className={reply.is_admin ? 'text-indigo-200' : 'text-cyan-200'}>
                  {reply.is_admin ? 'Admin' : 'User'} · {new Date(reply.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-slate-300">{reply.message}</p>
              </div>
            ))}
          </div>
          {ticket.status !== 'CLOSED' && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={replyText[ticket.id] ?? ''}
                onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                placeholder="Reply to this ticket"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <button onClick={() => reply(ticket.id)} className="w-fit rounded-full border border-white/10 px-4 py-1.5 text-sm">
                Send reply
              </button>
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No tickets found.</div>}
      {toast && <p className="text-xs text-cyan-200">{toast}</p>}
    </div>
  );
}

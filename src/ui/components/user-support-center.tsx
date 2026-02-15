'use client';

import { useMemo, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Reply = { id: string; message: string; is_admin: boolean; created_at: string; author?: { email?: string | null } };
export type UserTicket = {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  replies: Reply[];
};

const statusClass: Record<UserTicket['status'], string> = {
  OPEN: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  IN_PROGRESS: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
  RESOLVED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  CLOSED: 'border-slate-400/30 bg-slate-400/10 text-slate-200'
};

export function UserSupportCenter({ initialTickets }: { initialTickets: UserTicket[] }) {
  const [tickets, setTickets] = useState<UserTicket[]>(initialTickets);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string>('');

  const ordered = useMemo(() => [...tickets].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)), [tickets]);

  async function reload() {
    const res = await fetch('/api/support/tickets', { cache: 'no-store' });
    const data = await safeJsonClient<{ ok: boolean; data: UserTicket[] }>(res);
    setTickets(data?.data ?? []);
  }

  async function createTicket() {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    const res = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message })
    });
    const data = await safeJsonClient<{ ok: boolean; message?: string }>(res);
    setLoading(false);
    if (!res.ok || !data?.ok) {
      setToast(data?.message ?? 'Failed to create ticket');
      return;
    }
    setSubject('');
    setMessage('');
    setToast('Ticket submitted');
    await reload();
  }

  async function sendReply(ticketId: string) {
    const msg = (replyText[ticketId] ?? '').trim();
    if (!msg) return;
    const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await safeJsonClient<{ ok: boolean; message?: string }>(res);
    if (!res.ok || !data?.ok) {
      setToast(data?.message ?? 'Failed to reply');
      return;
    }
    setReplyText(prev => ({ ...prev, [ticketId]: '' }));
    setToast('Reply sent');
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Raise new ticket</h2>
        <div className="mt-3 grid gap-3">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Describe your issue"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <button disabled={loading} onClick={createTicket} className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm">
            {loading ? 'Submitting...' : 'Submit ticket'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {ordered.map(ticket => (
          <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{ticket.subject}</p>
              <span className={`rounded-full border px-3 py-1 text-xs ${statusClass[ticket.status]}`}>{ticket.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{ticket.message}</p>
            <p className="mt-1 text-xs text-slate-400">Updated: {new Date(ticket.updated_at).toLocaleString()}</p>
            <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
              {ticket.replies.map(reply => (
                <div key={reply.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
                  <p className={reply.is_admin ? 'text-cyan-200' : 'text-slate-200'}>
                    {reply.is_admin ? 'Admin' : 'You'} · {new Date(reply.created_at).toLocaleString()}
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
                  placeholder="Write a reply"
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
                <button onClick={() => sendReply(ticket.id)} className="w-fit rounded-full border border-white/10 px-4 py-1.5 text-sm">
                  Send reply
                </button>
              </div>
            )}
          </div>
        ))}
        {ordered.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">No tickets yet.</div>}
      </div>
      {toast && <p className="text-xs text-cyan-200">{toast}</p>}
    </div>
  );
}

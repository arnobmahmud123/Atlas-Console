'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Row = {
  id: string;
  method: string;
  amount: string;
  transaction_id?: string;
  payout_number?: string;
  receipt_file_url?: string | null;
  created_at: string;
  User?: { email?: string | null };
};

export function AdminManualQueue(props: { type: 'deposit' | 'withdrawal' }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const base = props.type === 'deposit' ? '/api/admin/deposit-requests' : '/api/admin/withdrawal-requests';

  async function load() {
    const res = await fetch(`${base}?status=PENDING_ADMIN_FINAL`, { cache: 'no-store' }).catch(() => null);
    if (!res) return;
    const data = await safeJsonClient<any>(res);
    setRows(data?.data ?? []);
  }

  useEffect(() => {
    load().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: 'approve' | 'reject') {
    setMessage(null);
    const payload = action === 'reject' ? { reason: reasonById[id] ?? '' } : undefined;
    const res = await fetch(`${base}/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      credentials: 'include'
    });
    const data = await safeJsonClient<any>(res);
    setMessage(res.ok ? data?.message ?? 'Updated' : data?.message ?? data?.error ?? 'Failed');
    await load();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Final approval</p>
          <h1 className="mt-2 text-2xl font-semibold">
            {props.type === 'deposit' ? 'Manual deposits' : 'Manual withdrawals'}
          </h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          onClick={() => load()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">{props.type === 'deposit' ? 'Tx ID' : 'Payout'}</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-white/10 align-top">
                <td className="px-3 py-3 text-slate-200">{r.User?.email ?? '-'}</td>
                <td className="px-3 py-3 text-slate-200">{r.method}</td>
                <td className="px-3 py-3 text-slate-200">${String(r.amount)}</td>
                <td className="px-3 py-3 text-slate-200">
                  {props.type === 'deposit' ? r.transaction_id : r.payout_number}
                  {props.type === 'deposit' && r.receipt_file_url ? (
                    <div className="mt-1">
                      <a className="text-xs text-cyan-200 underline" href={r.receipt_file_url} target="_blank" rel="noreferrer">
                        Receipt
                      </a>
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      onClick={() => act(r.id, 'approve')}
                    >
                      Final approve
                    </button>
                    <input
                      value={reasonById[r.id] ?? ''}
                      onChange={e => setReasonById(v => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Reject reason"
                      className="w-44 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                      onClick={() => act(r.id, 'reject')}
                    >
                      Final reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-300" colSpan={6}>
                  Nothing pending.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}

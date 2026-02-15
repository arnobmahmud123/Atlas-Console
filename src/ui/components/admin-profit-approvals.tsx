'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Row = {
  id: string;
  period_type: 'DAILY' | 'WEEKLY';
  period_start: string;
  period_end: string;
  total_profit: string;
  total_investment_amount?: string | null;
  recipient_count?: number | null;
  status: string;
  submission_attachment_url?: string | null;
  submitted_note?: string | null;
  revision_count?: number;
  CreatedByAccountant?: { email?: string | null };
  comments?: Array<{
    id: string;
    author_role: string;
    type: string;
    message: string;
    attachment_url?: string | null;
    created_at: string;
    author?: { email?: string | null };
  }>;
};

export function AdminProfitApprovals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [approvedRows, setApprovedRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [attachmentById, setAttachmentById] = useState<Record<string, string>>({});
  const [adjustedProfitById, setAdjustedProfitById] = useState<Record<string, string>>({});

  async function load() {
    const [pendingRes, approvedRes] = await Promise.all([
      fetch('/api/admin/profit-batches?status=PENDING_ADMIN_FINAL', { cache: 'no-store' }).catch(() => null),
      fetch('/api/admin/profit-batches?status=APPROVED', { cache: 'no-store' }).catch(() => null)
    ]);
    if (!pendingRes || !approvedRes) {
      setMessage('Failed to load pending profit batches.');
      return;
    }
    const pendingPayload = await safeJsonClient<any>(pendingRes);
    const approvedPayload = await safeJsonClient<any>(approvedRes);
    if (!pendingRes.ok || !approvedRes.ok) {
      setRows([]);
      setApprovedRows([]);
      setMessage(
        pendingPayload?.message ??
          pendingPayload?.error ??
          approvedPayload?.message ??
          approvedPayload?.error ??
          'Failed to load pending profit batches.'
      );
      return;
    }
    setRows(pendingPayload?.data ?? []);
    setApprovedRows(approvedPayload?.data ?? []);
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  async function approve(id: string) {
    setMessage(null);
    const res = await fetch(`/api/admin/profit-batches/${id}/final-approve`, {
      method: 'PATCH',
      credentials: 'include'
    });
    const payload = await safeJsonClient<any>(res);
    setMessage(payload?.message ?? payload?.error ?? (res.ok ? 'Approved' : 'Failed'));
    await load();
  }

  async function reject(id: string, mode: 'REQUEST_CHANGES' | 'FINAL_REJECT') {
    setMessage(null);
    const res = await fetch(`/api/admin/profit-batches/${id}/final-reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        reason: rejectReasonById[id] ?? '',
        mode,
        attachmentUrl: attachmentById[id] ?? undefined,
        adjustedTotalProfit: adjustedProfitById[id] ?? undefined
      })
    });
    const payload = await safeJsonClient<any>(res);
    setMessage(payload?.message ?? payload?.error ?? (res.ok ? 'Rejected' : 'Failed'));
    await load();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Final approval</p>
      <h1 className="mt-2 text-2xl font-semibold">Profit batch approvals</h1>
      <p className="mt-2 text-sm text-slate-300">Final approval credits user profit, then triggers idempotent multi-level referral commissions.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Total Profit</th>
              <th className="px-3 py-2">Total Investment</th>
              <th className="px-3 py-2">Recipients</th>
              <th className="px-3 py-2">Submitted By</th>
              <th className="px-3 py-2">Attachment</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-white/10 align-top">
                <td className="px-3 py-3 text-slate-200">
                  {r.period_type}
                  <div className="text-xs text-slate-400">
                    {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-3 py-3">${String(r.total_profit)}</td>
                <td className="px-3 py-3">{r.total_investment_amount ? `$${r.total_investment_amount}` : '-'}</td>
                <td className="px-3 py-3">{r.recipient_count ?? '-'}</td>
                <td className="px-3 py-3">{r.CreatedByAccountant?.email ?? '-'}</td>
                <td className="px-3 py-3 text-xs text-slate-300">
                  {r.submission_attachment_url ? (
                    <a href={r.submission_attachment_url} target="_blank" rel="noreferrer" className="text-cyan-200 underline">
                      Open sheet
                    </a>
                  ) : (
                    '-'
                  )}
                  {r.submitted_note ? <div className="mt-1 text-slate-400">{r.submitted_note}</div> : null}
                  {r.revision_count ? <div className="mt-1 text-slate-500">Revisions: {r.revision_count}</div> : null}
                  {r.comments?.length ? (
                    <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Timeline</p>
                      <div className="mt-1 space-y-1">
                        {r.comments.map(c => (
                          <div key={c.id} className="text-[11px] leading-4 text-slate-300">
                            <span className="font-medium text-cyan-200">{c.author?.email ?? c.author_role}</span>
                            <span className="mx-1 text-slate-600">·</span>
                            <span>{c.type}</span>
                            <span className="mx-1 text-slate-600">·</span>
                            <span className="text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                            <div>{c.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-white/10 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20" onClick={() => approve(r.id)}>
                      Final approve
                    </button>
                    <input
                      value={rejectReasonById[r.id] ?? ''}
                      onChange={e => setRejectReasonById(v => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Reject reason"
                      className="w-44 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white placeholder:text-slate-500"
                    />
                    <input
                      value={adjustedProfitById[r.id] ?? ''}
                      onChange={e => setAdjustedProfitById(v => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Adjusted total profit"
                      className="w-40 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white placeholder:text-slate-500"
                    />
                    <input
                      value={attachmentById[r.id] ?? ''}
                      onChange={e => setAttachmentById(v => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Attachment URL to send back"
                      className="w-56 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white placeholder:text-slate-500"
                    />
                    <button className="rounded-full border border-white/10 bg-amber-500/10 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/20" onClick={() => reject(r.id, 'REQUEST_CHANGES')}>
                      Request changes
                    </button>
                    <button className="rounded-full border border-white/10 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20" onClick={() => reject(r.id, 'FINAL_REJECT')}>
                      Final reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-slate-300">
                  No profit batches pending admin final approval.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <h2 className="text-sm font-semibold text-white">Approved periods (download Excel)</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {['DAILY', 'WEEKLY', 'MONTHLY', 'HALF_YEARLY', 'YEARLY'].map(range => (
            <a key={range} href={`/api/reports/profit/period?range=${range}`} className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">
              {range} report
            </a>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-full border border-white/10 bg-black/30 px-3 py-1" />
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-full border border-white/10 bg-black/30 px-3 py-1" />
          <a
            href={`/api/reports/profit/period?range=MONTHLY${customStart ? `&start=${encodeURIComponent(customStart)}` : ''}${customEnd ? `&end=${encodeURIComponent(customEnd)}` : ''}`}
            className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
          >
            Custom Date Report
          </a>
        </div>
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          {approvedRows.slice(0, 10).map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <span>
                {r.period_type} · {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}
              </span>
              <a
                href={`/api/reports/profit/${r.id}`}
                className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
              >
                Download Excel
              </a>
            </div>
          ))}
          {approvedRows.length === 0 ? <p>No approved periods yet.</p> : null}
        </div>
      </div>

      {message ? <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">{message}</div> : null}
    </div>
  );
}

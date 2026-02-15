'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Row = {
  id: string;
  method: string;
  amount: string;
  reject_reason?: string | null;
  updated_at?: string;
  transaction_id?: string;
  payout_number?: string;
  receipt_file_url?: string | null;
  payout_confirmed_at?: string | null;
  payout_screenshot_url?: string | null;
  payout_note?: string | null;
  created_at: string;
  User?: { email?: string | null };
  FinalizedByAdmin?: { email?: string | null };
};
type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function AccountantQueue(props: { type: 'deposit' | 'withdrawal' }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [rejectedRows, setRejectedRows] = useState<Row[]>([]);
  const [approvedRows, setApprovedRows] = useState<Row[]>([]);
  const [approvedMeta, setApprovedMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });
  const [message, setMessage] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [proofById, setProofById] = useState<Record<string, string>>({});
  const [proofNoteById, setProofNoteById] = useState<Record<string, string>>({});

  const base =
    props.type === 'deposit' ? '/api/accountant/deposit-requests' : '/api/accountant/withdrawal-requests';

  async function load(page = approvedMeta.page) {
    const [pendingRes, rejectedRes, approvedRes] = await Promise.all([
      fetch(`${base}?status=PENDING_ACCOUNTANT`, { cache: 'no-store' }).catch(() => null),
      fetch(`${base}?status=REJECTED`, { cache: 'no-store' }).catch(() => null),
      fetch(`${base}?status=APPROVED&page=${page}&pageSize=10`, { cache: 'no-store' }).catch(() => null)
    ]);
    if (!pendingRes || !rejectedRes || !approvedRes) return;
    const pendingData = await safeJsonClient<any>(pendingRes);
    const rejectedData = await safeJsonClient<any>(rejectedRes);
    const approvedData = await safeJsonClient<any>(approvedRes);
    setRows(pendingData?.data ?? []);
    setRejectedRows((rejectedData?.data ?? []).slice(0, 10));
    setApprovedRows(approvedData?.data ?? []);
    setApprovedMeta(
      approvedData?.meta ?? {
        page,
        pageSize: 10,
        total: (approvedData?.data ?? []).length,
        totalPages: 1
      }
    );
  }

  useEffect(() => {
    load(approvedMeta.page).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedMeta.page]);

  function exportApprovedExcel() {
    const url = `${base}?status=APPROVED&page=${approvedMeta.page}&pageSize=${approvedMeta.pageSize}&format=csv`;
    window.open(url, '_blank');
  }

  function exportRejectedExcel() {
    const url = `${base}?status=REJECTED&page=1&pageSize=100&format=csv`;
    window.open(url, '_blank');
  }

  function exportPdf(kind: 'approved' | 'rejected') {
    const rows = kind === 'approved' ? approvedRows : rejectedRows;
    const w = window.open('', '_blank', 'width=980,height=720');
    if (!w) return;
    const rowsHtml = rows
      .map(r => {
        const secondary = props.type === 'deposit' ? (r.transaction_id ?? '-') : (r.payout_number ?? '-');
        return `<tr>
          <td>${r.id}</td>
          <td>${r.User?.email ?? '-'}</td>
          <td>${r.method}</td>
          <td>$${String(r.amount)}</td>
          <td>${secondary}</td>
          <td>${r.FinalizedByAdmin?.email ?? 'Admin'}</td>
          <td>${new Date(r.updated_at ?? r.created_at).toLocaleString()}</td>
        </tr>`;
      })
      .join('');
    const tableBody =
      rowsHtml ||
      `<tr><td colspan="7" style="text-align:center;color:#666">No ${kind} items available.</td></tr>`;
    w.document.open();
    w.document.write(`
      <html><head><title>${kind === 'approved' ? 'Approved' : 'Rejected'} ${props.type === 'deposit' ? 'Deposits' : 'Withdrawals'}</title>
      <style>body{font-family:Arial;padding:16px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:8px;font-size:12px}</style>
      </head><body>
      <h2>${kind === 'approved' ? 'Approved' : 'Rejected'} ${props.type === 'deposit' ? 'Deposits' : 'Withdrawals'} ${kind === 'approved' ? `(Page ${approvedMeta.page})` : ''}</h2>
      <table><thead><tr><th>ID</th><th>User</th><th>Method</th><th>Amount</th><th>${props.type === 'deposit' ? 'Tx ID' : 'Payout'}</th><th>Finalized By</th><th>Updated</th></tr></thead><tbody>${tableBody}</tbody></table>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.setTimeout(() => w.print(), 250);
  }

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

  async function confirmPaid(id: string) {
    setMessage(null);
    const screenshotUrl = (proofById[id] ?? '').trim();
    const note = (proofNoteById[id] ?? '').trim();
    if (!screenshotUrl) {
      setMessage('Payment screenshot URL is required.');
      return;
    }

    const res = await fetch(`${base}/${id}/confirm-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ screenshotUrl, note: note || undefined })
    });
    const data = await safeJsonClient<any>(res);
    setMessage(res.ok ? data?.message ?? 'Updated' : data?.message ?? data?.error ?? 'Failed');
    await load();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Pending</p>
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
                      Approve
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
                      Reject
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

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Admin Rejections (Recent)</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              onClick={exportRejectedExcel}
            >
              Export Excel
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              onClick={() => exportPdf('rejected')}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {rejectedRows.map(r => (
            <div key={r.id} className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-100">{r.User?.email ?? '-'} · ${String(r.amount)} · {r.method}</span>
                <span className="text-xs text-slate-300">
                  {r.updated_at ? new Date(r.updated_at).toLocaleString() : ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-200">
                Rejected by: {r.FinalizedByAdmin?.email ?? 'Admin'}{r.reject_reason ? ` — ${r.reject_reason}` : ''}
              </p>
            </div>
          ))}
          {rejectedRows.length === 0 ? <p className="text-slate-300">No recent admin rejections.</p> : null}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Approved</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              onClick={exportApprovedExcel}
            >
              Export Excel
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              onClick={() => exportPdf('approved')}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {approvedRows.map(r => (
            <div key={r.id} className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-100">{r.User?.email ?? '-'} · ${String(r.amount)} · {r.method}</span>
                <span className="text-xs text-slate-300">
                  {r.updated_at ? new Date(r.updated_at).toLocaleString() : ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-200">Finalized by: {r.FinalizedByAdmin?.email ?? 'Admin'}</p>
              {props.type === 'withdrawal' ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                  <p className="text-[11px] text-slate-400">Payment proof confirmation</p>
                  {r.payout_confirmed_at ? (
                    <div className="mt-1 text-xs text-slate-300">
                      Confirmed: {new Date(r.payout_confirmed_at).toLocaleString()}
                      {r.payout_screenshot_url ? (
                        <>
                          {' · '}
                          <a className="text-cyan-200 underline" href={r.payout_screenshot_url} target="_blank" rel="noreferrer">
                            View screenshot
                          </a>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={proofById[r.id] ?? ''}
                        onChange={e => setProofById(v => ({ ...v, [r.id]: e.target.value }))}
                        placeholder="Payment screenshot URL"
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                      />
                      <input
                        value={proofNoteById[r.id] ?? ''}
                        onChange={e => setProofNoteById(v => ({ ...v, [r.id]: e.target.value }))}
                        placeholder="Note (optional)"
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => confirmPaid(r.id)}
                        className="rounded-full border border-white/10 bg-cyan-500/20 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-500/30"
                      >
                        Confirm paid
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
          {approvedRows.length === 0 ? <p className="text-slate-300">No approved items yet.</p> : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span>
            Page {approvedMeta.page} of {approvedMeta.totalPages} · {approvedMeta.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setApprovedMeta(v => ({ ...v, page: Math.max(1, v.page - 1) }))}
              disabled={approvedMeta.page <= 1}
              className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setApprovedMeta(v => ({ ...v, page: Math.min(v.totalPages, v.page + 1) }))}
              disabled={approvedMeta.page >= approvedMeta.totalPages}
              className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type ProfitBatchRow = {
  id: string;
  period_type: 'DAILY' | 'WEEKLY';
  period_start: string;
  period_end: string;
  total_profit: string;
  status: string;
  created_at: string;
  submission_attachment_url?: string | null;
  submitted_note?: string | null;
  revision_count?: number;
  reject_reason?: string;
  FinalizedByAdmin?: { email?: string | null };
  comments?: Array<{
    id: string;
    author_role: 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'STAFF';
    type: string;
    message: string;
    attachment_url?: string | null;
    created_at: string;
    author?: { email?: string | null };
  }>;
};
type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function toIsoDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function AccountantProfitBatches() {
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<ProfitBatchRow[]>([]);
  const [rejectedRows, setRejectedRows] = useState<ProfitBatchRow[]>([]);
  const [approvedRows, setApprovedRows] = useState<ProfitBatchRow[]>([]);
  const [approvedMeta, setApprovedMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [periodType, setPeriodType] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [periodStart, setPeriodStart] = useState<string>(toIsoDate(new Date().toISOString()));
  const [periodEnd, setPeriodEnd] = useState<string>(toIsoDate(new Date().toISOString()));
  const [totalProfit, setTotalProfit] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [submittedNote, setSubmittedNote] = useState<string>('');
  const [resubmitAmountById, setResubmitAmountById] = useState<Record<string, string>>({});
  const [resubmitAttachmentById, setResubmitAttachmentById] = useState<Record<string, string>>({});
  const [resubmitNoteById, setResubmitNoteById] = useState<Record<string, string>>({});
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  async function load(page = approvedMeta.page) {
    const [pendingRes, rejectedRes, approvedRes] = await Promise.all([
      fetch('/api/accountant/profit-batches?status=PENDING_ADMIN_FINAL', {
        cache: 'no-store',
        credentials: 'include'
      }).catch(() => null),
      fetch('/api/accountant/profit-batches?status=REJECTED', {
        cache: 'no-store',
        credentials: 'include'
      }).catch(() => null),
      fetch(`/api/accountant/profit-batches?status=APPROVED&page=${page}&pageSize=10`, {
        cache: 'no-store',
        credentials: 'include'
      }).catch(() => null)
    ]);
    if (!pendingRes || !rejectedRes || !approvedRes) {
      setMessage('Failed to load submitted profit batches.');
      return;
    }
    const pendingPayload = await safeJsonClient<any>(pendingRes);
    const rejectedPayload = await safeJsonClient<any>(rejectedRes);
    const approvedPayload = await safeJsonClient<any>(approvedRes);
    if (!pendingRes.ok || !rejectedRes.ok || !approvedRes.ok) {
      setRows([]);
      setRejectedRows([]);
      setApprovedRows([]);
      setMessage(
        pendingPayload?.message ??
          pendingPayload?.error ??
          rejectedPayload?.message ??
          rejectedPayload?.error ??
          approvedPayload?.message ??
          approvedPayload?.error ??
          'Failed to load submitted profit batches.'
      );
      return;
    }
    setRows(pendingPayload?.data ?? []);
    setRejectedRows((rejectedPayload?.data ?? []).slice(0, 20));
    setApprovedRows(approvedPayload?.data ?? []);
    setApprovedMeta(
      approvedPayload?.meta ?? {
        page,
        pageSize: 10,
        total: (approvedPayload?.data ?? []).length,
        totalPages: 1
      }
    );
  }

  useEffect(() => {
    load(approvedMeta.page).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedMeta.page]);

  function exportApprovedExcel() {
    const url = `/api/accountant/profit-batches?status=APPROVED&page=${approvedMeta.page}&pageSize=${approvedMeta.pageSize}&format=csv`;
    window.open(url, '_blank');
  }

  function exportRejectedExcel() {
    const url = '/api/accountant/profit-batches?status=REJECTED&page=1&pageSize=100&format=csv';
    window.open(url, '_blank');
  }

  function exportPdf(kind: 'approved' | 'rejected') {
    const rows = kind === 'approved' ? approvedRows : rejectedRows;
    const w = window.open('', '_blank', 'width=980,height=720');
    if (!w) return;
    const rowsHtml = rows
      .map(
        r => `<tr>
      <td>${r.id}</td>
      <td>${r.period_type}</td>
      <td>${new Date(r.period_start).toLocaleDateString()} - ${new Date(r.period_end).toLocaleDateString()}</td>
      <td>$${String(r.total_profit)}</td>
      <td>${r.FinalizedByAdmin?.email ?? 'Admin'}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
    </tr>`
      )
      .join('');
    const tableBody =
      rowsHtml || '<tr><td colspan="6" style="text-align:center;color:#666">No rows available.</td></tr>';
    w.document.open();
    w.document.write(`
      <html><head><title>${kind === 'approved' ? 'Approved' : 'Rejected'} Profit Batches</title>
      <style>body{font-family:Arial;padding:16px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:8px;font-size:12px}</style>
      </head><body>
      <h2>${kind === 'approved' ? 'Approved' : 'Rejected'} Profit Batches ${kind === 'approved' ? `(Page ${approvedMeta.page})` : ''}</h2>
      <table><thead><tr><th>ID</th><th>Type</th><th>Period</th><th>Total Profit</th><th>Finalized By</th><th>Created</th></tr></thead><tbody>${tableBody}</tbody></table>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.setTimeout(() => w.print(), 250);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/accountant/profit-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          periodType,
          periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
          periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
          totalProfit,
          submissionAttachmentUrl: attachmentUrl || undefined,
          submittedNote: submittedNote || undefined
        })
      });
      const payload = await safeJsonClient<any>(res);
      setMessage(payload?.message ?? payload?.error ?? (res.ok ? 'Submitted' : 'Failed'));
      if (res.ok) {
        setTotalProfit('');
        setAttachmentUrl('');
        setSubmittedNote('');
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onResubmit(id: string) {
    setMessage(null);
    const payload = {
      totalProfit: resubmitAmountById[id] || undefined,
      submissionAttachmentUrl: resubmitAttachmentById[id] || undefined,
      submittedNote: resubmitNoteById[id] || undefined
    };
    const res = await fetch(`/api/accountant/profit-batches/${id}/resubmit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await safeJsonClient<any>(res);
    setMessage(data?.message ?? data?.error ?? (res.ok ? 'Resubmitted' : 'Failed'));
    if (res.ok) {
      setResubmitAmountById(v => ({ ...v, [id]: '' }));
      setResubmitAttachmentById(v => ({ ...v, [id]: '' }));
      setResubmitNoteById(v => ({ ...v, [id]: '' }));
      await load();
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Profit batch</p>
        <h1 className="mt-2 text-2xl font-semibold">Create daily/weekly profit batch</h1>
        <p className="mt-2 text-sm text-slate-300">Submit batch to admin final approval. No wallet credit happens at this stage.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-300">
            Period type
            <select value={periodType} onChange={e => setPeriodType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Period start
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-300">
            Period end
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-300">
            Total profit
            <input value={totalProfit} onChange={e => setTotalProfit(e.target.value)} placeholder="1000.00" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-300">
            Attachment URL (Excel / docs)
            <input value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-300">
            Note for admin
            <input value={submittedNote} onChange={e => setSubmittedNote(e.target.value)} placeholder="Summary / assumptions" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </label>
        </div>
        <button disabled={submitting} className="mt-4 rounded-full border border-white/10 bg-cyan-500/20 px-4 py-2 text-sm">
          {submitting ? 'Submitting...' : 'Submit for admin final approval'}
        </button>
        {message ? <p className="mt-3 text-sm text-slate-200">{message}</p> : null}
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Pending admin final approval</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {rows.map(r => (
            <div key={r.id} className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span>{r.period_type} | {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}</span>
              <span>${String(r.total_profit)}</span>
            </div>
          ))}
          {rows.length === 0 ? <p>No pending batches.</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Rejected by admin (recent)</h2>
          <div className="flex gap-2">
            <button onClick={exportRejectedExcel} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
              Export Excel
            </button>
            <button onClick={() => exportPdf('rejected')} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
              Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {rejectedRows.map(r => (
            <div key={r.id} className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {r.period_type} | {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()} | ${String(r.total_profit)}
                </span>
                <span className="text-xs text-slate-300">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-rose-200">
                Rejected by: {r.FinalizedByAdmin?.email ?? 'Admin'}
                {r.reject_reason ? ` — ${r.reject_reason}` : ''}
              </p>
              {r.comments?.length ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Communication</p>
                  <div className="mt-1 space-y-1">
                    {r.comments.map(c => (
                      <div key={c.id} className="text-xs text-slate-200">
                        <span className="font-medium text-cyan-200">
                          {c.author?.email ?? c.author_role}
                        </span>
                        <span className="mx-1 text-slate-500">·</span>
                        <span className="text-slate-400">{c.type}</span>
                        <span className="mx-1 text-slate-500">·</span>
                        <span className="text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        <div className="mt-0.5 text-slate-300">{c.message}</div>
                        {c.attachment_url ? (
                          <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-cyan-200 underline">
                            Attachment
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {r.comments?.[0]?.attachment_url ? (
                <a href={r.comments[0].attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-200 underline">
                  View admin attachment
                </a>
              ) : null}
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input
                  value={resubmitAmountById[r.id] ?? ''}
                  onChange={e => setResubmitAmountById(v => ({ ...v, [r.id]: e.target.value }))}
                  placeholder="Adjusted total profit (optional)"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                />
                <input
                  value={resubmitAttachmentById[r.id] ?? ''}
                  onChange={e => setResubmitAttachmentById(v => ({ ...v, [r.id]: e.target.value }))}
                  placeholder="New attachment URL"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    value={resubmitNoteById[r.id] ?? ''}
                    onChange={e => setResubmitNoteById(v => ({ ...v, [r.id]: e.target.value }))}
                    placeholder="Reply / note"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                  />
                  <button onClick={() => onResubmit(r.id)} className="rounded-full border border-white/10 bg-cyan-500/20 px-3 py-1 text-xs">
                    Resubmit
                  </button>
                </div>
              </div>
            </div>
          ))}
          {rejectedRows.length === 0 ? <p>No rejected batches yet.</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Approved batches</h2>
          <div className="flex gap-2">
            <button onClick={exportApprovedExcel} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
              Export Excel
            </button>
            <button onClick={() => exportPdf('approved')} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
              Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {['DAILY', 'WEEKLY', 'MONTHLY', 'HALF_YEARLY', 'YEARLY'].map(range => (
            <a key={range} href={`/api/reports/profit/period?range=${range}`} className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">
              {range} report
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-full border border-white/10 bg-black/30 px-3 py-1" />
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-full border border-white/10 bg-black/30 px-3 py-1" />
          <a
            href={`/api/reports/profit/period?range=MONTHLY${customStart ? `&start=${encodeURIComponent(customStart)}` : ''}${customEnd ? `&end=${encodeURIComponent(customEnd)}` : ''}`}
            className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
          >
            Custom Date Report
          </a>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {approvedRows.map(r => (
            <div key={r.id} className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {r.period_type} | {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()} | ${String(r.total_profit)}
                </span>
                <div className="flex items-center gap-2">
                  <a href={`/api/reports/profit/${r.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/10">
                    Download Excel
                  </a>
                  <span className="text-xs text-slate-300">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-emerald-200">Finalized by: {r.FinalizedByAdmin?.email ?? 'Admin'}</p>
            </div>
          ))}
          {approvedRows.length === 0 ? <p>No approved batches yet.</p> : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span>
            Page {approvedMeta.page} of {approvedMeta.totalPages} · {approvedMeta.total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setApprovedMeta(v => ({ ...v, page: Math.max(1, v.page - 1) }))}
              disabled={approvedMeta.page <= 1}
              className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setApprovedMeta(v => ({ ...v, page: Math.min(v.totalPages, v.page + 1) }))}
              disabled={approvedMeta.page >= approvedMeta.totalPages}
              className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

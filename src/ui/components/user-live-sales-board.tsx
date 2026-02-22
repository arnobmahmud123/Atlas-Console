'use client';

import { useEffect, useMemo, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Entry = {
  id: string;
  product_name: string;
  product_id?: string | null;
  quantity: number;
  line_total: string;
  line_profit: string;
  created_at: string;
};

type SessionRow = {
  id: string;
  business_date: string;
  status: 'OPEN' | 'CLOSED';
  day_sales_total: string;
  day_profit_total: string;
  line_items_count: number;
  entries?: Entry[];
};

type ApiPayload = {
  ok: boolean;
  data?: {
    session: SessionRow | null;
    recentDays: SessionRow[];
  };
  message?: string;
};

function fmtMoney(value?: string | number | null) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export function UserLiveSalesBoard() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`/api/user/live-sales${qs}`, { cache: 'no-store', credentials: 'include' }).catch(() => null);
    if (!res) {
      setMessage('Failed to fetch sales board');
      setLoading(false);
      return;
    }
    const payload = await safeJsonClient<ApiPayload>(res);
    if (!res.ok || !payload?.ok) {
      setMessage(payload?.message ?? 'Failed to load sales board');
      setLoading(false);
      return;
    }
    const nextRows = payload.data?.recentDays ?? [];
    const nextSession = payload.data?.session ?? null;
    setRows(nextRows);
    setSession(nextSession);
    if (!date && nextSession?.business_date) {
      setSelectedDate(new Date(nextSession.business_date).toISOString().slice(0, 10));
    }
    setMessage(null);
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    load().catch(() => setMessage('Failed to load sales board'));
    const timer = setInterval(() => {
      load(selectedDate || undefined).catch(() => null);
    }, 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    load(selectedDate).catch(() => setMessage('Failed to load sales board'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const statusBadge = useMemo(() => {
    if (!session) return 'border-white/10 bg-white/5 text-slate-300';
    return session.status === 'OPEN'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
      : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  }, [session]);

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Live Sales Board</p>
            <h1 className="mt-2 text-2xl font-semibold">Business sales activity</h1>
            <p className="mt-2 text-sm text-slate-300">Live sales line items and day totals for investors/shareholders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="">Latest day</option>
              {rows.map(r => {
                const v = new Date(r.business_date).toISOString().slice(0, 10);
                return (
                  <option key={r.id} value={v}>
                    {v} · {r.status}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => load(selectedDate || undefined)}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className={`rounded-full border px-3 py-1 ${statusBadge}`}>{session?.status ?? 'NO DATA'}</span>
          <span>Day: {session ? fmtDate(session.business_date) : '-'}</span>
          <span>Auto-refresh: every 15s</span>
          <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
        </div>
        {message ? <p className="mt-3 text-xs text-rose-200">{message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Day Sales Total</p>
          <p className="mt-2 text-2xl font-semibold">{fmtMoney(session?.day_sales_total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Day Profit Total</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{fmtMoney(session?.day_profit_total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Line Items</p>
          <p className="mt-2 text-2xl font-semibold">{session?.line_items_count ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sales entries ({session ? fmtDate(session.business_date) : '—'})</h2>
          <span className="text-xs text-slate-400">Showing latest 100 items</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Product ID</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Line Total</th>
                <th className="px-3 py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {(session?.entries ?? []).map(entry => (
                <tr key={entry.id} className="border-t border-white/10">
                  <td className="px-3 py-3 text-slate-300">{new Date(entry.created_at).toLocaleTimeString()}</td>
                  <td className="px-3 py-3 text-white">{entry.product_name}</td>
                  <td className="px-3 py-3 text-slate-300">{entry.product_id ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-300">{entry.quantity}</td>
                  <td className="px-3 py-3 text-white">{fmtMoney(entry.line_total)}</td>
                  <td className="px-3 py-3 text-emerald-300">{fmtMoney(entry.line_profit)}</td>
                </tr>
              ))}
              {!loading && (session?.entries?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-slate-300">No sales entries yet for this day.</td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-slate-300">Loading sales board...</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Recent sales days</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedDate(new Date(r.business_date).toISOString().slice(0, 10))}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{fmtDate(r.business_date)}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${r.status === 'OPEN' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                  {r.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Sales: {fmtMoney(r.day_sales_total)}</p>
              <p className="text-xs text-slate-400">Profit: {fmtMoney(r.day_profit_total)}</p>
              <p className="text-xs text-slate-400">Items: {r.line_items_count}</p>
            </button>
          ))}
          {!loading && rows.length === 0 ? <p className="text-sm text-slate-300">No sales sessions available yet.</p> : null}
        </div>
      </div>
    </div>
  );
}


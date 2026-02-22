'use client';

import { useEffect, useMemo, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type SalesEntry = {
  id: string;
  product_name: string;
  product_id?: string | null;
  quantity: number;
  selling_price: string;
  cost_price: string;
  line_total: string;
  line_profit: string;
  created_at: string;
};

type SalesSession = {
  id: string;
  business_date: string;
  status: 'OPEN' | 'CLOSED';
  day_sales_total: string;
  day_profit_total: string;
  day_balance: string;
  profit_balance: string;
  line_items_count: number;
  ended_at?: string | null;
  entries: SalesEntry[];
};

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function money(v?: string | number | null) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export function AdminDailySalesManager(props: { mode: 'entry' | 'report' }) {
  const [date, setDate] = useState('');
  const [session, setSession] = useState<SalesSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [lineProfit, setLineProfit] = useState('');

  const qtyNum = Number(quantity || 0);
  const sellNum = Number(sellingPrice || 0);
  const costNum = Number(costPrice || 0);
  const lineProfitNum = Number(lineProfit || 0);

  const preview = useMemo(() => {
    const lineTotal = Math.max(0, qtyNum) * Math.max(0, sellNum);
    const profit = lineProfit.trim()
      ? Math.max(0, lineProfitNum)
      : Math.max(0, lineTotal - Math.max(0, qtyNum) * Math.max(0, costNum));
    return { lineTotal, lineProfit: profit };
  }, [qtyNum, sellNum, costNum, lineProfit, lineProfitNum]);

  async function load() {
    setLoading(true);
    setMessage(null);
    const qs = new URLSearchParams({ date });
    if (props.mode === 'entry') qs.set('ensure', '1');
    const res = await fetch(`/api/admin/daily-sales?${qs.toString()}`, { cache: 'no-store' }).catch(() => null);
    if (!res) {
      setLoading(false);
      setMessage('Failed to fetch sales day');
      return;
    }
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to load');
      setLoading(false);
      return;
    }
    setSession(data?.session ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (!date) {
      setDate(todayStr());
      return;
    }
  }, [date]);

  useEffect(() => {
    if (!date) return;
    load().catch(() => setMessage('Failed to load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, props.mode]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (props.mode !== 'entry') return;
    setSubmitting(true);
    setMessage(null);
    const payload: Record<string, unknown> = {
      date,
      productName,
      productId,
      quantity,
      sellingPrice
    };
    if (costPrice.trim()) payload.costPrice = costPrice;
    if (lineProfit.trim()) payload.lineProfit = lineProfit;

    const res = await fetch('/api/admin/daily-sales/line-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to add line item');
      setSubmitting(false);
      return;
    }
    setSession(data?.session ?? null);
    setMessage(data?.message ?? 'Line item added');
    setProductName('');
    setProductId('');
    setQuantity('1');
    setSellingPrice('');
    setCostPrice('');
    setLineProfit('');
    setSubmitting(false);
  }

  async function patchSession(action: 'END_DAY' | 'REOPEN') {
    setMessage(null);
    const res = await fetch('/api/admin/daily-sales/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ date, action })
    });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to update session');
      return;
    }
    setSession(data?.session ?? null);
    setMessage(data?.message ?? 'Updated');
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
          {props.mode === 'entry' ? 'Daily Sales Entry' : 'Daily Sales Report'}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {props.mode === 'entry' ? 'Record daily purchases' : 'View daily sales by date'}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {props.mode === 'entry'
            ? 'Add line items one-by-one, keep the day open, and close it with End of Day.'
            : 'Review all line items and final totals for a selected business date.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-300">Business date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => load()}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs"
          >
            Refresh
          </button>
          {session ? (
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                session.status === 'OPEN'
                  ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-300/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              {session.status === 'OPEN' ? 'Open Day' : 'Closed Day'}
            </span>
          ) : (
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">No session for date</span>
          )}
        </div>
        {message ? <p className="mt-3 text-xs text-slate-300">{message}</p> : null}
      </div>

      {props.mode === 'entry' ? (
        <form onSubmit={addItem} className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product name *" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="Product ID (optional)" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" placeholder="Quantity" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="Selling price *" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input value={costPrice} onChange={e => setCostPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="Cost price (or use line profit)" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
            <input value={lineProfit} onChange={e => setLineProfit(e.target.value)} type="number" step="0.01" min="0" placeholder="Line profit (optional override)" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <span>Line Total: <strong className="text-white">{money(preview.lineTotal)}</strong></span>
              <span>Line Profit: <strong className="text-emerald-300">{money(preview.lineProfit)}</strong></span>
            </div>
            <button
              type="submit"
              disabled={submitting || (session?.status === 'CLOSED')}
              className="rounded-full border border-white/10 bg-cyan-500/20 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Line Item'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Day Sales Total</p>
          <p className="mt-2 text-2xl font-semibold">{money(session?.day_sales_total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Day Profit Total</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{money(session?.day_profit_total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Daily Balance</p>
          <p className="mt-2 text-2xl font-semibold">{money(session?.day_balance)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Profit Balance</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{money(session?.profit_balance)}</p>
        </div>
      </div>

      {props.mode === 'entry' && session ? (
        <div className="flex flex-wrap items-center gap-3">
          {session.status === 'OPEN' ? (
            <button
              type="button"
              onClick={() => patchSession('END_DAY')}
              className="rounded-full border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200"
            >
              End of Day (Lock)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => patchSession('REOPEN')}
              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200"
            >
              Re-open Day
            </button>
          )}
          <span className="text-xs text-slate-400">
            {session.status === 'CLOSED'
              ? `Closed at ${session.ended_at ? new Date(session.ended_at).toLocaleString() : '—'}`
              : 'Day remains open and accumulates entries.'}
          </span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Entries for {date || '...'}</h2>
          <span className="text-xs text-slate-400">{session?.entries?.length ?? 0} item(s)</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Product ID</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Selling Price</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Line Total</th>
                <th className="px-3 py-2">Line Profit</th>
              </tr>
            </thead>
            <tbody>
              {(session?.entries ?? []).map(item => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-3 py-3 text-slate-300">{new Date(item.created_at).toLocaleTimeString()}</td>
                  <td className="px-3 py-3 text-white">{item.product_name}</td>
                  <td className="px-3 py-3 text-slate-300">{item.product_id || '-'}</td>
                  <td className="px-3 py-3 text-slate-300">{item.quantity}</td>
                  <td className="px-3 py-3 text-slate-300">{money(item.selling_price)}</td>
                  <td className="px-3 py-3 text-slate-300">{money(item.cost_price)}</td>
                  <td className="px-3 py-3 text-white">{money(item.line_total)}</td>
                  <td className="px-3 py-3 text-emerald-300">{money(item.line_profit)}</td>
                </tr>
              ))}
              {(session?.entries?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-slate-300">
                    {loading ? 'Loading...' : 'No entries for this day.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
            {session ? (
              <tfoot>
                <tr className="border-t border-white/10 bg-black/20">
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>Totals</td>
                  <td className="px-3 py-3 font-semibold text-white">{money(session.day_sales_total)}</td>
                  <td className="px-3 py-3 font-semibold text-emerald-300">{money(session.day_profit_total)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}

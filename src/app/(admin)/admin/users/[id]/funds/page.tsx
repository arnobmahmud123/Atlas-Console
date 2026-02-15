'use client';

import { use, useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type LedgerAccount = {
  id: string;
  name: string;
  account_no: string;
  User?: { email: string; role: string } | null;
  Wallet?: { name: string; type: string } | null;
};

const SYSTEM_ACCOUNT_NOS = new Set(['1000', '2000']);

export default function AdminUserFundsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('Admin adjustment');
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}/accounts`)
      .then(res => safeJsonClient<any>(res))
      .then(data => setAccounts(data?.data ?? []))
      .catch(() => setAccounts([]));
  }, [id]);

  async function onSubmit() {
    setSaved(false);
    setMessage(null);
    const res = await fetch(`/api/admin/users/${id}/funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debitAccountId, creditAccountId, amount, referenceId }),
      credentials: 'include'
    });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? data?.error ?? 'Failed to post adjustment.');
      return;
    }
    setSaved(true);
    setMessage(data?.message ?? 'Adjustment posted.');
  }

  const systemAccounts = accounts.filter(a => SYSTEM_ACCOUNT_NOS.has(a.account_no));
  const userAccounts = accounts.filter(a => !SYSTEM_ACCOUNT_NOS.has(a.account_no));

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Adjust Balance</p>
        <h1 className="mt-2 text-2xl font-semibold">User ledger adjustment</h1>
        <p className="mt-2 text-sm text-slate-300">
          To change the user balance, pick one user account and one system account (1000/2000).
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="text-sm text-slate-300">Debit account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={debitAccountId}
          onChange={e => setDebitAccountId(e.target.value)}
        >
          <option value="">Select account</option>
          <optgroup label="User accounts">
            {userAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_no} · {acc.name} · {acc.User?.email ?? 'User'}
              </option>
            ))}
          </optgroup>
          <optgroup label="System accounts">
            {systemAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_no} · {acc.name}
              </option>
            ))}
          </optgroup>
        </select>

        <label className="text-sm text-slate-300">Credit account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={creditAccountId}
          onChange={e => setCreditAccountId(e.target.value)}
        >
          <option value="">Select account</option>
          <optgroup label="User accounts">
            {userAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_no} · {acc.name} · {acc.User?.email ?? 'User'}
              </option>
            ))}
          </optgroup>
          <optgroup label="System accounts">
            {systemAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_no} · {acc.name}
              </option>
            ))}
          </optgroup>
        </select>

        <label className="text-sm text-slate-300">Amount</label>
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="100.00"
        />

        <label className="text-sm text-slate-300">Reference</label>
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={referenceId}
          onChange={e => setReferenceId(e.target.value)}
        />

        <button onClick={onSubmit} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Submit adjustment
        </button>
        {message ? <p className="text-xs text-slate-200">{message}</p> : null}
        {saved && <p className="text-xs text-cyan-200">Balance will reflect instantly via ledger.</p>}
      </div>
    </div>
  );
}

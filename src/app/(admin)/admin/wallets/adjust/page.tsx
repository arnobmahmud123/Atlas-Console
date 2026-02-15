'use client';

import { useEffect, useState } from 'react';

type LedgerAccount = {
  id: string;
  name: string;
  account_no: string;
  User?: { email: string; role: string } | null;
  Wallet?: { name: string; type: string; currency: string } | null;
};

export default function AdminWalletAdjustPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('Admin adjustment');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/wallets/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data.data ?? []));
  }, []);

  async function onSubmit() {
    setSaved(false);
    await fetch('/api/admin/wallets/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debitAccountId, creditAccountId, amount, referenceId })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Wallet Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Adjust balance</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="text-sm text-slate-300">Debit account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={debitAccountId}
          onChange={e => setDebitAccountId(e.target.value)}
        >
          <option value="">Select account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.account_no} · {acc.name} · {acc.User?.email ?? 'User'}
            </option>
          ))}
        </select>

        <label className="text-sm text-slate-300">Credit account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={creditAccountId}
          onChange={e => setCreditAccountId(e.target.value)}
        >
          <option value="">Select account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.account_no} · {acc.name} · {acc.User?.email ?? 'User'}
            </option>
          ))}
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
        {saved && <p className="text-xs text-cyan-200">Adjustment posted</p>}
      </div>
    </div>
  );
}

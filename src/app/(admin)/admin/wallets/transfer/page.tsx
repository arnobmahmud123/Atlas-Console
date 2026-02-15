'use client';

import { useEffect, useState } from 'react';

type LedgerAccount = {
  id: string;
  name: string;
  account_no: string;
  User?: { email: string; role: string } | null;
  Wallet?: { name: string; type: string; currency: string } | null;
};

export default function AdminWalletTransferPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/wallets/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data.data ?? []));
  }, []);

  async function onSubmit() {
    setSaved(false);
    await fetch('/api/admin/wallets/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAccountId, toAccountId, amount, note })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Wallet Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Internal transfer</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="text-sm text-slate-300">From account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={fromAccountId}
          onChange={e => setFromAccountId(e.target.value)}
        >
          <option value="">Select account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.account_no} · {acc.name} · {acc.User?.email ?? 'User'}
            </option>
          ))}
        </select>

        <label className="text-sm text-slate-300">To account</label>
        <select
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={toAccountId}
          onChange={e => setToAccountId(e.target.value)}
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

        <label className="text-sm text-slate-300">Note</label>
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <button onClick={onSubmit} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Submit transfer
        </button>
        {saved && <p className="text-xs text-cyan-200">Transfer posted</p>}
      </div>
    </div>
  );
}

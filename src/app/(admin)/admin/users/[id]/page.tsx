'use client';

import { use, useEffect, useState } from 'react';

type LoginHistory = {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  succeeded: boolean;
  created_at: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: string;
  status: string;
  created_at: string;
};

type LedgerAccount = {
  id: string;
  account_no: string;
  name: string;
  Wallet?: { name: string; type: string } | null;
};

export default function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logins, setLogins] = useState<LoginHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txStatus, setTxStatus] = useState('');
  const [txType, setTxType] = useState('');
  const [txStart, setTxStart] = useState('');
  const [txEnd, setTxEnd] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);

  async function safeJson(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(res => safeJson(res))
      .then(data => {
        if (!data?.user) return;
        setEmail(data.user.email);
        setRole(data.user.role);
        setIsActive(data.user.is_active);
        setIsVerified(data.user.is_verified);
      });

    fetch(`/api/admin/users/${id}/logins`)
      .then(res => safeJson(res))
      .then(data => setLogins(data?.data ?? []));

    fetch(`/api/admin/users/${id}/transactions`)
      .then(res => safeJson(res))
      .then(data => setTransactions(data?.data ?? []));

    fetch(`/api/admin/users/${id}/accounts`)
      .then(res => safeJson(res))
      .then(data => setAccounts(data?.data ?? []));
  }, [id]);

  function reloadTransactions() {
    const qs = new URLSearchParams();
    if (txStatus) qs.set('status', txStatus);
    if (txType) qs.set('type', txType);
    if (txStart) qs.set('start', txStart);
    if (txEnd) qs.set('end', txEnd);
    fetch(`/api/admin/users/${id}/transactions?${qs.toString()}`)
      .then(res => safeJson(res))
      .then(data => setTransactions(data?.data ?? []));
  }

  async function onSave() {
    setSaved(false);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, isActive, isVerified })
    });
    setSaved(true);
  }

  async function onToggleBlock() {
    setBlockLoading(true);
    const res = await fetch(`/api/admin/users/${id}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive })
    });
    const data = await safeJson(res);
    if (data?.user) {
      setIsActive(data.user.is_active);
    }
    setBlockLoading(false);
  }

  async function onImpersonate() {
    const res = await fetch(`/api/admin/users/${id}/impersonate`, { method: 'POST' });
    const data = await safeJson(res);
    if (data?.url) window.location.href = data.url;
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Edit User</p>
        <h1 className="mt-2 text-2xl font-semibold">User details</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={role} onChange={e => setRole(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} /> Verified
        </label>
        <div className="flex gap-2">
          <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
          <button onClick={onToggleBlock} className="rounded-full border border-white/10 px-4 py-2 text-sm">
            {blockLoading ? 'Updating...' : isActive ? 'Block user' : 'Unblock user'}
          </button>
          <button onClick={onImpersonate} className="rounded-full border border-white/10 px-4 py-2 text-sm">Login as user</button>
          <a href={`/admin/users/${id}/funds`} className="rounded-full border border-white/10 px-4 py-2 text-sm">
            Adjust balance
          </a>
        </div>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Login history</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {logins.map(login => (
            <div key={login.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{login.ip_address ?? 'Unknown IP'}</span>
              <span>{login.succeeded ? 'Success' : 'Failed'}</span>
              <span className="text-xs text-slate-400">{new Date(login.created_at).toLocaleString()}</span>
            </div>
          ))}
          {logins.length === 0 && <p>No login history.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Ledger accounts</h2>
        <p className="mt-1 text-xs text-slate-400">Linked accounts for wallet adjustments.</p>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-white">{acc.account_no}</span>
              <span className="text-xs text-slate-400">{acc.name}</span>
              <span className="text-xs text-slate-400">{acc.Wallet?.name ?? 'Wallet'}</span>
            </div>
          ))}
          {accounts.length === 0 && <p>No ledger accounts found.</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              fetch(`/api/admin/users/${id}/accounts`)
                .then(res => safeJson(res))
                .then(data => setAccounts(data?.data ?? []));
            }}
            className="rounded-full border border-white/10 px-3 py-1 text-xs"
          >
            Refresh accounts
          </button>
          <a href={`/admin/users/${id}/funds`} className="rounded-full border border-white/10 px-3 py-1 text-xs">
            Adjust balance
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Transaction history</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <select value={txStatus} onChange={e => setTxStatus(e.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
            <option value="">All status</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
          <select value={txType} onChange={e => setTxType(e.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
            <option value="">All types</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="INVESTMENT">INVESTMENT</option>
            <option value="DIVIDEND">DIVIDEND</option>
          </select>
          <input type="date" value={txStart} onChange={e => setTxStart(e.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <input type="date" value={txEnd} onChange={e => setTxEnd(e.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white" />
          <button onClick={reloadTransactions} className="rounded-full border border-white/10 px-3 py-1">Filter</button>
          <a
            href={`/api/admin/users/${id}/transactions/export?status=${txStatus}&type=${txType}&start=${txStart}&end=${txEnd}`}
            className="rounded-full border border-white/10 px-3 py-1"
          >
            Export CSV
          </a>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{tx.type}</span>
              <span>${tx.amount}</span>
              <span className="text-xs text-slate-400">{tx.status}</span>
            </div>
          ))}
          {transactions.length === 0 && <p>No transactions.</p>}
        </div>
      </div>
    </div>
  );
}

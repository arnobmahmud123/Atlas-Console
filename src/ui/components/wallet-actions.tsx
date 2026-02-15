'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export function WalletActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bkashNumber, setBkashNumber] = useState<string>('01XXXXXXXXX');
  const [nagadNumber, setNagadNumber] = useState<string>('01XXXXXXXXX');
  const [depositMode, setDepositMode] = useState<'INSTANT' | 'MOBILE'>('INSTANT');
  const [withdrawMode, setWithdrawMode] = useState<'STANDARD' | 'MOBILE'>('STANDARD');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/public/payment-instructions', { cache: 'no-store' }).catch(() => null);
      if (!res) return;
      const data = await safeJsonClient<any>(res);
      if (data?.ok) {
        setBkashNumber(data.bkashNumber ?? bkashNumber);
        setNagadNumber(data.nagadNumber ?? nagadNumber);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeposit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const amount = String(formData.get('deposit_amount') || '');

    if (depositMode === 'INSTANT') {
      const paymentMethod = String(formData.get('payment_method') || 'STRIPE');
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod })
      });
      const data = await res.json().catch(() => ({}));
      const errorText = data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).flat().join(', ')
        : data?.message;
      setMessage(res.ok ? `Deposit request created (#${data.depositId ?? 'new'})` : errorText || 'Failed to create deposit');
      setLoading(false);
      return;
    }

    const method = String(formData.get('mobile_method') || 'BKASH');
    const transactionId = String(formData.get('transaction_id') || '');
    const file = formData.get('receipt');
    let receiptFileUrl: string | undefined;
    if (file instanceof File && file.size > 0) {
      const up = new FormData();
      up.set('file', file);
      const upRes = await fetch('/api/uploads/receipt', { method: 'POST', body: up });
      const upData = await safeJsonClient<any>(upRes);
      if (!upRes.ok || !upData?.ok) {
        setMessage(upData?.message ?? 'Failed to upload receipt');
        setLoading(false);
        return;
      }
      receiptFileUrl = upData.url;
    }

    const res = await fetch('/api/deposit-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amount, transactionId, receiptFileUrl })
    });
    const data = await safeJsonClient<any>(res);
    const err =
      data?.message ??
      (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(', ') : null) ??
      `Deposit failed (HTTP ${res.status})`;
    setMessage(res.ok ? (data?.message ?? 'Deposit submitted') : err);
    setLoading(false);
  }

  async function handleWithdrawal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const amount = String(formData.get('withdraw_amount') || '');
    const otp = String(formData.get('otp') || '');

    if (withdrawMode === 'STANDARD') {
      const withdrawMethod = String(formData.get('withdraw_method') || 'BANK');
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, withdrawMethod, otp: otp || undefined })
      });
      const data = await res.json().catch(() => ({}));
      const errorText = Array.isArray(data?.errors)
        ? data.errors.join(', ')
        : data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).flat().join(', ')
        : data?.message;
      setMessage(res.ok ? 'Withdrawal request submitted' : errorText || 'Failed to request withdrawal');
      setLoading(false);
      return;
    }

    const method = String(formData.get('mobile_method_withdraw') || 'BKASH');
    const payoutNumber = String(formData.get('payout_number') || '');
    const res = await fetch('/api/withdrawal-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amount, payoutNumber, otp: otp || undefined })
    });
    const data = await safeJsonClient<any>(res);
    const err =
      data?.message ??
      (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(', ') : null) ??
      `Withdrawal failed (HTTP ${res.status})`;
    setMessage(res.ok ? (data?.message ?? 'Withdrawal submitted') : err);
    setLoading(false);
  }

  async function handleTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const toUserId = String(formData.get('to_user_id') || '');
    const amount = String(formData.get('transfer_amount') || '');

    const res = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId, amount })
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Transfer completed (${data.transaction?.id ?? 'tx'})` : 'Failed to transfer');
    setLoading(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Deposit</h2>
        <form className="mt-4 space-y-3" onSubmit={handleDeposit}>
          <select
            value={depositMode}
            onChange={e => setDepositMode(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="INSTANT">Instant (Card/Crypto/Bank)</option>
            <option value="MOBILE">Mobile banking (bKash/Nagad)</option>
          </select>
          <Input name="deposit_amount" placeholder="Amount" required />
          {depositMode === 'INSTANT' ? (
            <select name="payment_method" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              <option value="STRIPE">Stripe</option>
              <option value="CRYPTO">Crypto</option>
              <option value="MANUAL">Manual</option>
              <option value="BANK">Bank</option>
            </select>
          ) : (
            <div className="space-y-3">
              <select name="mobile_method" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
              </select>
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">
                <p className="text-white">Payment instructions</p>
                <p className="mt-1">bKash: <span className="text-cyan-200">{bkashNumber}</span></p>
                <p>Nagad: <span className="text-cyan-200">{nagadNumber}</span></p>
              </div>
              <Input name="transaction_id" placeholder="Transaction ID" required />
              <input
                type="file"
                name="receipt"
                accept="image/png,image/jpeg,image/webp"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-slate-200"
              />
            </div>
          )}
          <Button className="w-full" disabled={loading}>Create deposit</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Withdraw</h2>
        <form className="mt-4 space-y-3" onSubmit={handleWithdrawal}>
          <select
            value={withdrawMode}
            onChange={e => setWithdrawMode(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="STANDARD">Standard</option>
            <option value="MOBILE">Mobile banking (bKash/Nagad)</option>
          </select>
          <Input name="withdraw_amount" placeholder="Amount" required />
          {withdrawMode === 'STANDARD' ? (
            <select name="withdraw_method" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              <option value="BANK">Bank</option>
              <option value="CRYPTO">Crypto</option>
              <option value="MANUAL">Manual</option>
              <option value="MOBILE_BANKING">Mobile banking</option>
            </select>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <select name="mobile_method_withdraw" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
              </select>
              <Input name="payout_number" placeholder="Payout number" required />
            </div>
          )}
          <Input name="otp" placeholder="Email verification code (6 digits)" />
          <Button className="w-full" disabled={loading}>Request withdrawal</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Internal transfer</h2>
        <form className="mt-4 space-y-3" onSubmit={handleTransfer}>
          <Input name="to_user_id" placeholder="Recipient user ID" required />
          <Input name="transfer_amount" placeholder="Amount" required />
          <Button className="w-full" disabled={loading}>Send transfer</Button>
        </form>
      </div>

      {message && (
        <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          {message}
        </div>
      )}
    </div>
  );
}

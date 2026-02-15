'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type AccountType = 'BANK' | 'CRYPTO' | 'MANUAL' | 'MOBILE_BANKING';
type MobileProvider = 'BKASH' | 'NAGAD';

export function PayoutSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [accountType, setAccountType] = useState<AccountType>('BANK');
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>('BKASH');
  const [accountNumber, setAccountNumber] = useState('');

  const isMobile = accountType === 'MOBILE_BANKING';
  const label = useMemo(() => {
    if (accountType === 'MOBILE_BANKING') return 'Wallet number';
    if (accountType === 'CRYPTO') return 'Wallet address';
    if (accountType === 'BANK') return 'Account number';
    return 'Reference / note';
  }, [accountType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/me/payout-account', { cache: 'no-store' }).catch(() => null);
      if (!res) return;
      const data = await safeJsonClient<any>(res);
      if (cancelled) return;
      if (data?.ok && data?.payoutAccount) {
        setAccountType(data.payoutAccount.account_type);
        setMobileProvider(data.payoutAccount.mobile_provider ?? 'BKASH');
        setAccountNumber(data.payoutAccount.account_number ?? '');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/me/payout-account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountType,
        mobileProvider: isMobile ? mobileProvider : undefined,
        accountNumber
      })
    });

    const data = await safeJsonClient<any>(res);
    const err =
      data?.message ??
      (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(', ') : null) ??
      `Failed to save (HTTP ${res.status})`;
    setMessage(res.ok ? (data?.message ?? 'Saved') : err);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Payout settings</p>
      <h2 className="mt-2 text-lg font-semibold">Payment method</h2>
      <p className="mt-1 text-sm text-slate-300">Only one method can be active at a time.</p>

      <form className="mt-4 space-y-3" onSubmit={onSave}>
        <div>
          <label className="text-xs text-slate-400">Account type</label>
          <select
            value={accountType}
            onChange={e => setAccountType(e.target.value as AccountType)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="BANK">Bank</option>
            <option value="CRYPTO">Crypto</option>
            <option value="MANUAL">Manual</option>
            <option value="MOBILE_BANKING">Mobile banking</option>
          </select>
        </div>

        {isMobile ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Mobile banking</label>
              <select
                value={mobileProvider}
                onChange={e => setMobileProvider(e.target.value as MobileProvider)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="BKASH">Bkash</option>
                <option value="NAGAD">Nagad</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">{label}</label>
              <Input
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="e.g. 01XXXXXXXXX"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-slate-400">{label}</label>
            <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={label} />
          </div>
        )}

        <Button className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>

      {message ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}

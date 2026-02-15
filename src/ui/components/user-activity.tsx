'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Deposit = { id: string; amount: string; payment_method: string; created_at: string };
type Withdrawal = { id: string; amount: string; withdraw_method: string; created_at: string };

export function UserActivity() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/user/activity', { cache: 'no-store', credentials: 'include' });
        const data = await safeJsonClient<any>(res);
        if (!mounted) return;
        if (!res.ok) {
          setError(data?.message ?? 'Failed to load activity');
          return;
        }
        setDeposits(data?.deposits ?? []);
        setWithdrawals(data?.withdrawals ?? []);
        setError(null);
      } catch {
        if (!mounted) return;
        setError('Failed to fetch activity');
      }
    }
    load().catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-card-steel ui-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Recent deposits</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {error ? <p className="text-rose-300">{error}</p> : null}
          {deposits.map(dep => (
            <div key={dep.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{dep.payment_method}</span>
              <span>${dep.amount}</span>
            </div>
          ))}
          {deposits.length === 0 && <p>No deposits yet.</p>}
        </div>
      </div>
      <div className="bg-card-indigo ui-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Recent withdrawals</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {error ? <p className="text-rose-300">{error}</p> : null}
          {withdrawals.map(wd => (
            <div key={wd.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{wd.withdraw_method}</span>
              <span>${wd.amount}</span>
            </div>
          ))}
          {withdrawals.length === 0 && <p>No withdrawals yet.</p>}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export function AdminWithdrawalActions({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: 'approve' | 'reject') {
    setLoading(action);
    setMessage(null);

    const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/${action}`, { method: 'POST' });
    const data = (await safeJsonClient<any>(res)) ?? {};

    if (res.ok && data.ok) {
      setMessage(data?.message ?? (action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected'));
      router.refresh();
    } else {
      setMessage(data?.message ?? data?.error ?? `Failed to ${action} withdrawal`);
    }

    setLoading(null);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => run('approve')}
          disabled={loading !== null}
          className="rounded-full border border-white/10 px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === 'approve' ? 'Approving...' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => run('reject')}
          disabled={loading !== null}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-red-300 disabled:opacity-60"
        >
          {loading === 'reject' ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
      {message ? <p className="text-xs text-slate-300">{message}</p> : null}
    </div>
  );
}


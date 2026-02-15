'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminDepositActionsProps = {
  depositId: string;
};

export function AdminDepositActions({ depositId }: AdminDepositActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: 'approve' | 'reject') {
    setLoading(action);
    setMessage(null);

    const res = await fetch(`/api/admin/deposits/${depositId}/${action}`, {
      method: 'POST'
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessage(action === 'approve' ? 'Deposit approved' : 'Deposit rejected');
      router.refresh();
    } else {
      setMessage(data?.message ?? data?.error ?? `Failed to ${action} deposit`);
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
      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}

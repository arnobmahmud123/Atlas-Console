'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export function AdminKycActions({ kycId }: { kycId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: 'approve' | 'reject') {
    setMessage(null);
    const res = await fetch(`/api/admin/kyc/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: kycId })
    });

    const data = (await safeJsonClient<any>(res)) ?? {};
    if (!res.ok || !data.ok) {
      setMessage(data?.message ?? data?.error ?? 'Action failed');
      return;
    }

    setMessage(data?.message ?? `KYC ${action}d`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run('approve')}
        className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run('reject')}
        className="rounded-full border border-white/10 px-3 py-1 text-xs text-rose-200 hover:bg-white/10 disabled:opacity-60"
      >
        Reject
      </button>
      {message ? <span className="ml-2 text-xs text-slate-300">{message}</span> : null}
    </div>
  );
}


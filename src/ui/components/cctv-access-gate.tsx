'use client';

import { useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export function CctvAccessGate() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onUnlock() {
    setLoading(true);
    setMessage(null);
    const res = await fetch('/api/cctv/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await safeJsonClient<{ ok?: boolean; message?: string }>(res);
    setLoading(false);
    if (!res.ok || !data?.ok) {
      setMessage(data?.message ?? 'Invalid password');
      return;
    }
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <h2 className="text-lg font-semibold text-white">CCTV Access Required</h2>
      <p className="mt-1 text-sm text-slate-300">Enter the viewing password provided by admin.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="CCTV password"
        />
        <button
          onClick={onUnlock}
          disabled={loading}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Unlock'}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-rose-300">{message}</p> : null}
    </div>
  );
}


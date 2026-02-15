'use client';

import { useState } from 'react';

export default function AdminCachePage() {
  const [done, setDone] = useState(false);

  async function onClear() {
    setDone(false);
    await fetch('/api/admin/cache', { method: 'POST' });
    setDone(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Clear Cache</p>
        <h1 className="mt-2 text-2xl font-semibold">Cache management</h1>
        <p className="mt-2 text-sm text-slate-300">Clear cached data and rebuild views.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <button onClick={onClear} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Clear cache
        </button>
        {done && <p className="mt-2 text-xs text-cyan-200">Cache cleared</p>}
      </div>
    </div>
  );
}

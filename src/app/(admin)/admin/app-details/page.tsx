'use client';

import { useEffect, useState } from 'react';

type Stats = { users: number; deposits: number; withdrawals: number; investments: number };

export default function AdminAppDetailsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/app-details')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Application Details</p>
        <h1 className="mt-2 text-2xl font-semibold">System overview</h1>
        <p className="mt-2 text-sm text-slate-300">Key metrics across the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Users', value: stats?.users ?? 0 },
          { label: 'Deposits', value: stats?.deposits ?? 0 },
          { label: 'Withdrawals', value: stats?.withdrawals ?? 0 },
          { label: 'Investments', value: stats?.investments ?? 0 }
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

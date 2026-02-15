'use client';

import { useEffect, useState } from 'react';
import { CircleChart } from './circle-chart';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type SeriesPoint = { label: string; value: number };

type MetricsResponse = {
  ok: boolean;
  deposits: SeriesPoint[];
  withdrawals: SeriesPoint[];
  earnings: SeriesPoint[];
};

export function UserMetrics() {
  const [data, setData] = useState<MetricsResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/user/metrics');
        const json = await safeJsonClient<MetricsResponse>(res);
        if (mounted) setData(json ?? { ok: false, deposits: [], withdrawals: [], earnings: [] });
      } catch {
        if (mounted) setData({ ok: false, deposits: [], withdrawals: [], earnings: [] });
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!data?.ok) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card-steel ui-surface rounded-2xl p-6">
            <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-20 w-full animate-pulse rounded-2xl bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CircleChart
        title="Deposits (7 days)"
        points={data.deposits}
        colors={['#22d3ee', '#60a5fa', '#34d399', '#a78bfa']}
      />
      <CircleChart
        title="Withdrawals (7 days)"
        points={data.withdrawals}
        colors={['#f97316', '#f59e0b', '#f43f5e', '#fb7185']}
      />
      <CircleChart
        title="Earnings (7 days)"
        points={data.earnings}
        colors={['#facc15', '#f59e0b', '#fde047', '#a7f3d0']}
      />
    </div>
  );
}

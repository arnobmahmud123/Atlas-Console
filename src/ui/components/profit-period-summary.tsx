'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';
import { formatCompactUsd, toFullUsd } from '@/lib/format/currency';

type ProfitData = {
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  last90Days: string;
  thisYear: string;
};

const labels: Array<{ key: keyof ProfitData; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'last90Days', label: 'Last 90 Days' },
  { key: 'thisYear', label: 'This Year' }
];

export function ProfitPeriodSummary() {
  const [data, setData] = useState<ProfitData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await fetch('/api/user/profit-summary', { cache: 'no-store' }).catch(() => null);
      if (!mounted || !res) return;
      const json = await safeJsonClient<{ ok: boolean; data: ProfitData }>(res);
      if (!mounted) return;
      setData(res.ok && json?.ok ? json.data : null);
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-card-steel ui-surface rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white">Profit Summary</h2>
      <p className="mt-1 text-xs text-slate-400">Calendar periods from credited profit entries.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map(item => {
          const value = data?.[item.key] ?? '0';
          return (
            <div key={item.key} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p title={toFullUsd(value)} className="mt-2 text-lg font-semibold text-white">
                {formatCompactUsd(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

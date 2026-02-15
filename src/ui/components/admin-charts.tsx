'use client';

import { useEffect, useState } from 'react';
import { CircleChart } from '@/ui/components/circle-chart';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Point = { label: string; value: number };

export function AdminCharts() {
  const [range, setRange] = useState('7');
  const [data, setData] = useState<{ deposits: Point[]; investments: Point[]; users: Point[] } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/admin/charts?range=${range}`)
      .then(res => safeJsonClient<any>(res))
      .then(json => {
        if (mounted) setData(json?.ok ? json : null);
      })
      .catch(() => {
        if (mounted) setData(null);
      });
    return () => {
      mounted = false;
    };
  }, [range]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <button onClick={() => setRange('7')} className="bg-card-navy ui-surface rounded-full px-3 py-1">7d</button>
        <button onClick={() => setRange('30')} className="bg-card-navy ui-surface rounded-full px-3 py-1">30d</button>
        <button onClick={() => setRange('90')} className="bg-card-navy ui-surface rounded-full px-3 py-1">90d</button>
      </div>
      {data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <CircleChart title="Deposits" points={data.deposits} />
          <CircleChart title="Investments" points={data.investments} />
          <CircleChart title="Users" points={data.users} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card-steel ui-surface rounded-2xl p-6">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-20 w-full animate-pulse rounded-2xl bg-white/10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

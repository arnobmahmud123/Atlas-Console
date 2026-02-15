'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Stats = {
  users: number | null;
  activeInvestments: number | null;
  successfulDeposits: number | null;
};

export function LiveStats() {
  const [stats, setStats] = useState<Stats>({
    users: null,
    activeInvestments: null,
    successfulDeposits: null
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/public/stats');
        const data = await safeJsonClient<any>(res);
        if (mounted) {
          setStats({
            users: data?.users ?? 0,
            activeInvestments: data?.activeInvestments ?? 0,
            successfulDeposits: data?.successfulDeposits ?? 0
          });
        }
      } catch {
        if (mounted) {
          setStats({ users: 0, activeInvestments: 0, successfulDeposits: 0 });
        }
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const items = [
    { label: 'Members', value: stats.users },
    { label: 'Active investments', value: stats.activeInvestments },
    { label: 'Successful deposits', value: stats.successfulDeposits }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(item => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">{item.label}</p>
          {item.value === null ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-full bg-white/10" />
          ) : (
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

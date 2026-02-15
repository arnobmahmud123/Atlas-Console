'use client';

import { useEffect, useState } from 'react';

type Tier = { name: string; threshold: number; bonus: number };

type Config = { enabled: boolean; tiers: Tier[] };

export default function AdminRankingBonusPage() {
  const [config, setConfig] = useState<Config>({ enabled: false, tiers: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bonus/ranking')
      .then(res => res.json())
      .then(data => setConfig(data.value ?? config));
  }, []);

  function addTier() {
    setConfig(prev => ({
      ...prev,
      tiers: [...prev.tiers, { name: 'Gold', threshold: 1000, bonus: 50 }]
    }));
  }

  function updateTier(idx: number, key: keyof Tier, value: string) {
    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => (i === idx ? { ...t, [key]: key === 'name' ? value : Number(value) } : t))
    }));
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/bonus/ranking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Bonus / Rewards</p>
        <h1 className="mt-2 text-2xl font-semibold">Ranking bonus</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
          Enable ranking bonus
        </label>
        {config.tiers.map((tier, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-3">
            <input className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} />
            <input className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={tier.threshold} onChange={e => updateTier(idx, 'threshold', e.target.value)} />
            <input className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={tier.bonus} onChange={e => updateTier(idx, 'bonus', e.target.value)} />
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={addTier} className="rounded-full border border-white/10 px-3 py-1 text-xs">Add tier</button>
          <button onClick={onSave} className="rounded-full border border-white/10 px-3 py-1 text-xs">Save</button>
          {saved && <span className="text-xs text-cyan-200">Saved</span>}
        </div>
      </div>
    </div>
  );
}

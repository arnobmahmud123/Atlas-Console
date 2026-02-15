'use client';

import { useEffect, useState } from 'react';

type Config = { enabled: boolean; levels: Array<{ level: number; percent: number }> };

export default function AdminReferralBonusPage() {
  const [config, setConfig] = useState<Config>({ enabled: true, levels: [{ level: 1, percent: 5 }] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bonus/referral')
      .then(res => res.json())
      .then(data => setConfig(data.value ?? config));
  }, []);

  function updateLevel(idx: number, value: string) {
    setConfig(prev => ({
      ...prev,
      levels: prev.levels.map((l, i) => (i === idx ? { ...l, percent: Number(value) } : l))
    }));
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/bonus/referral', {
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
        <h1 className="mt-2 text-2xl font-semibold">Referral bonus</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
          Enable referral bonus
        </label>
        {config.levels.map((level, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-16 text-xs">Level {level.level}</span>
            <input className="w-24 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={level.percent} onChange={e => updateLevel(idx, e.target.value)} />
            <span className="text-xs">%</span>
          </div>
        ))}
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

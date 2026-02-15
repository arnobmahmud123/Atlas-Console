'use client';

import { useEffect, useState } from 'react';

type Config = { enabled: boolean; amount: number };

export default function AdminSignupBonusPage() {
  const [config, setConfig] = useState<Config>({ enabled: false, amount: 0 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bonus/signup')
      .then(res => res.json())
      .then(data => setConfig(data.value ?? config));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/bonus/signup', {
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
        <h1 className="mt-2 text-2xl font-semibold">Signup bonus</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
          Enable signup bonus
        </label>
        <input className="w-32 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={config.amount} onChange={e => setConfig({ ...config, amount: Number(e.target.value) })} />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

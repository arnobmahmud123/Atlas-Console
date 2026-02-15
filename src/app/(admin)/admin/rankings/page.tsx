'use client';

import { useEffect, useState } from 'react';

type RankLevel = { name: string; threshold: number; bonus: number };

type RankingSettings = { levels: RankLevel[] };

const defaults: RankingSettings = {
  levels: [
    { name: 'Bronze', threshold: 500, bonus: 25 },
    { name: 'Silver', threshold: 2500, bonus: 120 },
    { name: 'Gold', threshold: 10000, bonus: 500 }
  ]
};

export default function AdminRankingsPage() {
  const [settings, setSettings] = useState<RankingSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/rankings')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  function updateLevel(idx: number, field: keyof RankLevel, value: string) {
    const levels = [...settings.levels];
    if (field === 'name') {
      levels[idx][field] = value;
    } else {
      levels[idx][field] = Number(value) || 0;
    }
    setSettings({ levels });
  }

  function addLevel() {
    setSettings({ levels: [...settings.levels, { name: 'New Level', threshold: 0, bonus: 0 }] });
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/rankings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">User Rankings</p>
        <h1 className="mt-2 text-2xl font-semibold">Badge levels & bonuses</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        {settings.levels.map((level, idx) => (
          <div key={idx} className="grid gap-3 md:grid-cols-3">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={level.name}
              onChange={e => updateLevel(idx, 'name', e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={level.threshold}
              onChange={e => updateLevel(idx, 'threshold', e.target.value)}
              placeholder="Threshold"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={level.bonus}
              onChange={e => updateLevel(idx, 'bonus', e.target.value)}
              placeholder="Bonus"
            />
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={addLevel} className="rounded-full border border-white/10 px-4 py-2 text-sm">Add level</button>
          <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save rankings</button>
        </div>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

type Level = { level: number; percent: number };

export default function ReferralCommissionConfig({
  initialLevels
}: {
  initialLevels: Level[];
}) {
  const [levels, setLevels] = useState<Level[]>(initialLevels);
  const [saved, setSaved] = useState(false);

  function updateLevel(idx: number, key: keyof Level, value: string) {
    setLevels(prev => prev.map((l, i) => (i === idx ? { ...l, [key]: Number(value) } : l)));
  }

  function addLevel() {
    setLevels(prev => [...prev, { level: prev.length + 1, percent: 0 }]);
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/referrals/commissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levels })
    });
    setSaved(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-slate-300">
      {levels.map((level, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-16 text-xs">Level {level.level}</span>
          <input
            className="w-24 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
            value={level.percent}
            onChange={e => updateLevel(idx, 'percent', e.target.value)}
          />
          <span className="text-xs">%</span>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={addLevel} className="rounded-full border border-white/10 px-3 py-1 text-xs">Add level</button>
        <button onClick={onSave} className="rounded-full border border-white/10 px-3 py-1 text-xs">Save</button>
        {saved && <span className="text-xs text-cyan-200">Saved</span>}
      </div>
    </div>
  );
}

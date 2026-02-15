'use client';

import { useEffect, useState } from 'react';

type ScheduleSettings = {
  dailyRewardsTime: string;
  weeklyAuditDay: string;
  weeklyAuditTime: string;
};

const defaults: ScheduleSettings = {
  dailyRewardsTime: '02:00',
  weeklyAuditDay: 'Sunday',
  weeklyAuditTime: '03:00'
};

export default function AdminSchedulePage() {
  const [settings, setSettings] = useState<ScheduleSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schedule')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Schedule</p>
        <h1 className="mt-2 text-2xl font-semibold">Automation timing</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="text-sm text-slate-300">Daily rewards time (UTC)</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.dailyRewardsTime}
          onChange={e => setSettings({ ...settings, dailyRewardsTime: e.target.value })}
        />
        <label className="text-sm text-slate-300">Weekly audit day</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.weeklyAuditDay}
          onChange={e => setSettings({ ...settings, weeklyAuditDay: e.target.value })}
        />
        <label className="text-sm text-slate-300">Weekly audit time (UTC)</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.weeklyAuditTime}
          onChange={e => setSettings({ ...settings, weeklyAuditTime: e.target.value })}
        />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save schedule
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

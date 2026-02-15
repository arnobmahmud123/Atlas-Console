'use client';

import { useEffect, useState } from 'react';

type Security = { enforce2faAdmin: boolean; enforce2faWithdrawals: boolean; maxLoginAttempts: number };

export default function AdminSecuritySettingsPage() {
  const [settings, setSettings] = useState<Security>({ enforce2faAdmin: true, enforce2faWithdrawals: true, maxLoginAttempts: 5 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/security')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/settings/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">System Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">Security settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.enforce2faAdmin} onChange={e => setSettings({ ...settings, enforce2faAdmin: e.target.checked })} />
          Require 2FA for admin
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.enforce2faWithdrawals} onChange={e => setSettings({ ...settings, enforce2faWithdrawals: e.target.checked })} />
          Require 2FA for withdrawals
        </label>
        <label className="text-sm text-slate-300">Max login attempts</label>
        <input className="w-32 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white" value={settings.maxLoginAttempts} onChange={e => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })} />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

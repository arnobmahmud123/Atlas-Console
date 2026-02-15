'use client';

import { useEffect, useState } from 'react';

type SmsSettings = { provider: string; apiKey: string; senderId: string };

export default function AdminSmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings>({ provider: 'twilio', apiKey: '', senderId: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/notifications/sms')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/notifications/sms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Notification System</p>
        <h1 className="mt-2 text-2xl font-semibold">SMS settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.provider} onChange={e => setSettings({ ...settings, provider: e.target.value })} placeholder="Provider" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} placeholder="API key" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.senderId} onChange={e => setSettings({ ...settings, senderId: e.target.value })} placeholder="Sender ID" />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

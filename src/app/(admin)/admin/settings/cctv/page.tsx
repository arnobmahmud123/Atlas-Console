'use client';

import { useEffect, useState } from 'react';

type CctvSettings = {
  enabled: boolean;
  passwordRequired: boolean;
  channelId: string;
  videoId: string;
  accessPassword: string;
  hasPassword: boolean;
};

const defaults: CctvSettings = {
  enabled: false,
  passwordRequired: false,
  channelId: '',
  videoId: '',
  accessPassword: '',
  hasPassword: false
};

export default function AdminCctvSettingsPage() {
  const [settings, setSettings] = useState<CctvSettings>(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/cctv')
      .then(res => res.json())
      .then(data => {
        if (!data?.value) return;
        setSettings({
          enabled: Boolean(data.value.enabled),
          passwordRequired: Boolean(data.value.passwordRequired),
          channelId: data.value.channelId ?? '',
          videoId: data.value.videoId ?? '',
          accessPassword: '',
          hasPassword: Boolean(data.value.hasPassword)
        });
      });
  }, []);

  async function onSave() {
    setSaved(false);
    setError(null);
    const res = await fetch('/api/admin/settings/cctv', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const message =
        data?.errors?.accessPassword?.[0] ??
        data?.errors?.channelId?.[0] ??
        'Failed to save CCTV settings';
      setError(message);
      return;
    }
    setSettings(prev => ({
      ...prev,
      accessPassword: '',
      hasPassword: Boolean(data?.value?.hasPassword)
    }));
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">System Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">CCTV stream</h1>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
          />
          Enable CCTV stream
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.passwordRequired}
            onChange={e => setSettings({ ...settings, passwordRequired: e.target.checked })}
          />
          Require CCTV password for viewers
        </label>
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={settings.channelId}
          onChange={e => setSettings({ ...settings, channelId: e.target.value })}
          placeholder="YouTube Channel ID (preferred)"
        />
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={settings.videoId}
          onChange={e => setSettings({ ...settings, videoId: e.target.value })}
          placeholder="YouTube Live Video ID (fallback)"
        />
        <input
          type="password"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={settings.accessPassword}
          onChange={e => setSettings({ ...settings, accessPassword: e.target.value })}
          placeholder={settings.hasPassword ? 'Set new CCTV password (optional)' : 'Set CCTV password'}
        />
        <p className="text-xs text-slate-400">
          Password status: {settings.hasPassword ? 'Configured' : 'Not configured'}
        </p>
        <p className="text-xs text-slate-400">
          If both are provided, channel ID is used. Keep stream key private; only embed IDs here.
        </p>
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save
        </button>
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        {saved ? <p className="text-xs text-cyan-200">Saved</p> : null}
      </div>
    </div>
  );
}

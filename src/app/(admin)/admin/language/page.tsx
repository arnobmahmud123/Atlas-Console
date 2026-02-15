'use client';

import { useEffect, useState } from 'react';

type LanguageSettings = {
  default: string;
  enabled: string[];
};

const defaults: LanguageSettings = {
  default: 'en',
  enabled: ['en', 'es', 'fr']
};

export default function AdminLanguageSettingsPage() {
  const [settings, setSettings] = useState<LanguageSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/language')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Language Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">Global languages</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.default}
          onChange={e => setSettings({ ...settings, default: e.target.value })}
          placeholder="Default language code"
        />
        <textarea
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          rows={4}
          value={settings.enabled.join('\n')}
          onChange={e => setSettings({ ...settings, enabled: e.target.value.split('\n').filter(Boolean) })}
          placeholder="Enabled languages, one per line"
        />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save languages
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

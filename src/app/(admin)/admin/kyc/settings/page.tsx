'use client';

import { useEffect, useState } from 'react';

type KycSettings = {
  requireBack: boolean;
  requireSelfie: boolean;
  allowedDocuments: string[];
};

export default function AdminKycSettingsPage() {
  const [settings, setSettings] = useState<KycSettings>({
    requireBack: true,
    requireSelfie: true,
    allowedDocuments: ['PASSPORT', 'NID', 'DRIVING_LICENSE']
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/kyc/settings')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/kyc/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  function toggleDoc(doc: string) {
    setSettings(prev => ({
      ...prev,
      allowedDocuments: prev.allowedDocuments.includes(doc)
        ? prev.allowedDocuments.filter(d => d !== doc)
        : [...prev.allowedDocuments, doc]
    }));
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">KYC Management</p>
        <h1 className="mt-2 text-2xl font-semibold">KYC form settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.requireBack} onChange={e => setSettings({ ...settings, requireBack: e.target.checked })} />
          Require document back image
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.requireSelfie} onChange={e => setSettings({ ...settings, requireSelfie: e.target.checked })} />
          Require selfie
        </label>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allowed documents</p>
          {['PASSPORT', 'NID', 'DRIVING_LICENSE'].map(doc => (
            <label key={doc} className="flex items-center gap-2">
              <input type="checkbox" checked={settings.allowedDocuments.includes(doc)} onChange={() => toggleDoc(doc)} />
              {doc}
            </label>
          ))}
        </div>
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save settings</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

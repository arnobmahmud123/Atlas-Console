'use client';

import { useEffect, useState } from 'react';

type Gateways = { stripe: boolean; bank: boolean; crypto: boolean };

export default function AdminPaymentGatewaySettingsPage() {
  const [settings, setSettings] = useState<Gateways>({ stripe: true, bank: true, crypto: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/payment-gateways')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/settings/payment-gateways', {
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
        <h1 className="mt-2 text-2xl font-semibold">Payment gateways</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.stripe} onChange={e => setSettings({ ...settings, stripe: e.target.checked })} />
          Stripe
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.bank} onChange={e => setSettings({ ...settings, bank: e.target.checked })} />
          Bank
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.crypto} onChange={e => setSettings({ ...settings, crypto: e.target.checked })} />
          Crypto
        </label>
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

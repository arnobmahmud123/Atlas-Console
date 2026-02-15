'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

type SetupResponse = {
  qrCodeUrl?: string | null;
  secret: string;
  recoveryCodes: string[];
};

export function TwoFactorSettingsPanel() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus() {
    const res = await fetch('/api/auth/2fa/status');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setStatus({ enabled: !!data.enabled });
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function startSetup() {
    setMessage(null);
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSetup({
        qrCodeUrl: data.qrCodeUrl ?? null,
        secret: data.secret,
        recoveryCodes: data.recoveryCodes ?? []
      });
    } else {
      setMessage(data?.message ?? 'Failed to start 2FA setup');
    }
  }

  async function enable() {
    setMessage(null);
    const res = await fetch('/api/auth/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.replace(/\D/g, '') })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage('Two-factor enabled');
      setSetup(null);
      setToken('');
      loadStatus();
    } else {
      setMessage(data?.message ?? 'Invalid token');
    }
  }

  async function disable() {
    setMessage(null);
    const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage('Two-factor disabled');
      loadStatus();
    } else {
      setMessage(data?.message ?? 'Failed to disable 2FA');
    }
  }

  async function regenerateCodes() {
    const res = await fetch('/api/auth/2fa/recovery', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSetup(prev => ({
        qrCodeUrl: prev?.qrCodeUrl ?? null,
        secret: prev?.secret ?? '',
        recoveryCodes: data.recoveryCodes ?? []
      }));
      setMessage('Recovery codes regenerated');
    } else {
      setMessage(data?.message ?? 'Failed to regenerate recovery codes');
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Security</p>
      <h1 className="text-2xl font-semibold">Two-Factor Authentication</h1>
      <p className="text-sm text-slate-300">Status: {status?.enabled ? 'Enabled' : 'Disabled'}</p>

      <div className="flex flex-wrap gap-3">
        <Button onClick={startSetup}>Start setup</Button>
        <Button variant="outline" onClick={disable}>Disable 2FA</Button>
        <Button variant="outline" onClick={regenerateCodes}>Regenerate recovery codes</Button>
      </div>

      {setup && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
            <p className="text-slate-300">Scan QR code in your authenticator app:</p>
            {setup.qrCodeUrl ? (
              <img src={setup.qrCodeUrl} alt="2FA QR" className="mt-3 h-40 w-40 rounded-lg bg-white" />
            ) : (
              <p className="mt-2 text-xs text-amber-200">QR code unavailable. Use the secret key below manually.</p>
            )}
            <p className="mt-3 text-xs text-slate-400 break-all">Secret: {setup.secret}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
            <p className="text-slate-300">Recovery codes:</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {setup.recoveryCodes.map(code => (
                <span key={code} className="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300">{code}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="Enter 2FA code" maxLength={8} />
            <Button onClick={enable}>Enable</Button>
          </div>
        </div>
      )}

      {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
    </div>
  );
}

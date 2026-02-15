'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeJsonClient } from '@/lib/http/safe-json-client';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { signOut } from 'next-auth/react';

export function ProfilePanel(props: {
  user: {
    email: string;
    role: string;
    UserProfile?: { full_name?: string | null; phone?: string | null; address?: string | null; avatar_url?: string | null } | null;
  };
  variant: 'admin' | 'user';
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initial = props.user.UserProfile ?? null;
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState(props.user.email);
  const [emailPassword, setEmailPassword] = useState('');

  // When the server revalidates and passes down new props, sync the inputs.
  // router.refresh() updates server props but client state won't update automatically.
  useEffect(() => {
    if (saving) return;
    const nextProfile = props.user.UserProfile ?? null;
    setFullName(nextProfile?.full_name ?? '');
    setPhone(nextProfile?.phone ?? '');
    setAddress(nextProfile?.address ?? '');
    setAvatarUrl(nextProfile?.avatar_url ?? '');
    setNewEmail(props.user.email);
  }, [props.user.email, props.user.UserProfile, saving]);

  const displayName = (fullName || props.user.UserProfile?.full_name || '').trim() || props.user.email;
  const initials = (displayName || props.user.email || 'U')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        avatarUrl: avatarUrl || undefined
      })
    });
    const data = (await safeJsonClient<any>(res)) ?? {};
    setMessage(data?.message ?? (res.ok ? 'Profile updated' : 'Failed to update profile'));
    if (res.ok) router.refresh();
    setSaving(false);
  }

  async function changePassword() {
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = (await safeJsonClient<any>(res)) ?? {};
    setMessage(data?.message ?? (res.ok ? 'Password updated' : 'Failed to update password'));
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      router.refresh();
    }
    setSaving(false);
  }

  async function changeEmail() {
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/me/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail, currentPassword: emailPassword })
    });
    const data = (await safeJsonClient<any>(res)) ?? {};
    setMessage(data?.message ?? (res.ok ? 'Email updated' : 'Failed to update email'));
    if (res.ok) {
      setEmailPassword('');
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="bg-enterprise-header ui-surface rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Profile</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {props.user.role}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-300">{props.user.email}</p>
        <p className="mt-2 text-sm text-slate-300">Manage your account details and security.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold" id="profile">Profile details</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="bg-card-navy ui-surface flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold text-white">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="text-xs text-slate-300">
              <div className="text-slate-400">Avatar</div>
              <div>Paste an image URL (optional)</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div id="email" />
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" />
            <Input
              type="password"
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder="Current password (to change email)"
            />
            <Button className="w-full" disabled={saving} onClick={changeEmail} variant="outline">
              {saving ? 'Saving...' : 'Change email'}
            </Button>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
            <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL (optional)" />
            <Button className="w-full" disabled={saving} onClick={saveProfile}>
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </div>

        <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold" id="password">Security</h2>
          <div className="mt-4 space-y-3">
            <Input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <Button className="w-full" disabled={saving} onClick={changePassword}>
              {saving ? 'Updating...' : 'Change password'}
            </Button>
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="bg-card-navy ui-surface rounded-2xl p-4 text-sm text-slate-300">{message}</div>
      ) : null}
    </div>
  );
}

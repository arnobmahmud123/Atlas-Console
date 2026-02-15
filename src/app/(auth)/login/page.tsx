'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { AuthShell } from '@/ui/layout/auth-shell';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [require2fa, setRequire2fa] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const otp = String(formData.get('otp') || '').trim();
    const recoveryCode = String(formData.get('recovery_code') || '').trim();
    const callbackUrl = email.toLowerCase().includes('admin') ? '/admin/dashboard' : '/dashboard';

    const precheck = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, otp, recovery_code: recoveryCode })
    });
    const precheckData = await precheck.json().catch(() => ({}));
    if (!precheck.ok) {
      const needs2fa = Boolean(precheckData?.requiresOtp || precheckData?.errors?.otp?.length);
      setRequire2fa(needs2fa);
      setMessage(precheckData?.message ?? 'Sign in failed. Check your credentials.');
      setLoading(false);
      return;
    }

    const authPayload: Record<string, string | boolean> = {
      email,
      password,
      callbackUrl,
      redirect: false
    };
    if (otp) authPayload.otp = otp;
    if (recoveryCode) authPayload.recovery_code = recoveryCode;

    const result = await signIn('credentials', authPayload);
    if (result?.error) {
      setRequire2fa(true);
      setMessage('Sign in failed. Check your credentials and verification code.');
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl;
    setLoading(false);
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input type="email" name="email" placeholder="Email" required />
        <Input type="password" name="password" placeholder="Password" required />
        <Input
          type="text"
          name="otp"
          placeholder={require2fa ? '2FA code (required)' : '2FA code (if enabled)'}
          inputMode="numeric"
          maxLength={8}
        />
        <Input
          type="text"
          name="recovery_code"
          placeholder="Recovery code (optional fallback)"
        />
        <Button className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="text-muted-foreground hover:text-foreground" href="/register">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}

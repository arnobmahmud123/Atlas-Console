'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/ui/layout/auth-shell';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      setMessage('Account created. Please sign in.');
      event.currentTarget.reset();
    } else {
      setMessage('Unable to create account.');
    }
    setLoading(false);
  }

  return (
    <AuthShell title="Create account" subtitle="Start building your portfolio">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input type="email" name="email" placeholder="Email" required />
        <Input type="password" name="password" placeholder="Password" required />
        <Button className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
      <div className="mt-4 text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/login">
          Already have an account? Sign in
        </Link>
      </div>
    </AuthShell>
  );
}

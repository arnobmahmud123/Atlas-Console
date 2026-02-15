'use client';

import { useState } from 'react';

export default function AdminUserCreatePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [saved, setSaved] = useState(false);

  async function onCreate() {
    setSaved(false);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Create User</p>
        <h1 className="mt-2 text-2xl font-semibold">New user</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Role"
          value={role}
          onChange={e => setRole(e.target.value)}
        />
        <button onClick={onCreate} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Create
        </button>
        {saved && <p className="text-xs text-cyan-200">Created</p>}
      </div>
    </div>
  );
}

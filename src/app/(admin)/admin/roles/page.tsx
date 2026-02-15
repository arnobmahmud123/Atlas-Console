'use client';

import { useEffect, useState } from 'react';

type Role = { name: string; permissions: string[] };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/roles')
      .then(res => res.json())
      .then(data => setRoles(data.value ?? []));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions: permissions.split(',').map(p => p.trim()).filter(Boolean) })
    });
    const updated = await fetch('/api/admin/roles').then(res => res.json());
    setRoles(updated.value ?? []);
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Admin & Staff Roles</p>
        <h1 className="mt-2 text-2xl font-semibold">Manage roles</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Role name" />
          <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={permissions} onChange={e => setPermissions(e.target.value)} placeholder="Permissions (comma separated)" />
          <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
          {saved && <p className="text-xs text-cyan-200">Saved</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Existing roles</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {roles.map(role => (
              <div key={role.name} className="border-b border-white/5 pb-2">
                <p className="text-white">{role.name}</p>
                <p className="text-xs text-slate-400">{role.permissions.join(', ')}</p>
              </div>
            ))}
            {roles.length === 0 && <p>No custom roles.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

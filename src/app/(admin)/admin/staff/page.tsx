'use client';

import { useEffect, useState } from 'react';

type Staff = { id: string; email: string; role: string; customRole?: string | null };

type Role = { name: string; permissions: string[] };

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/staff')
      .then(res => res.json())
      .then(data => setStaff(data.data ?? []));
    fetch('/api/admin/roles')
      .then(res => res.json())
      .then(data => setRoles(data.value ?? []));
  }, []);

  async function onAssign() {
    setSaved(false);
    await fetch('/api/admin/staff/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUserId, role: selectedRole })
    });
    const updated = await fetch('/api/admin/staff').then(res => res.json());
    setStaff(updated.data ?? []);
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Admin & Staff Roles</p>
        <h1 className="mt-2 text-2xl font-semibold">Manage staff</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
          <option value="">Select user</option>
          {staff.map(user => (
            <option key={user.id} value={user.id}>{user.email}</option>
          ))}
        </select>
        <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
          {roles.map(role => (
            <option key={role.name} value={role.name}>{role.name}</option>
          ))}
        </select>
        <button onClick={onAssign} className="rounded-full border border-white/10 px-4 py-2 text-sm">Assign role</button>
        {saved && <p className="text-xs text-cyan-200">Assigned</p>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Current staff</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {staff.filter(user => user.role === 'ADMIN' || user.role === 'STAFF').map(user => (
            <div key={user.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{user.email}</span>
              <span>{user.customRole ?? user.role}</span>
            </div>
          ))}
          {staff.filter(user => user.role === 'ADMIN' || user.role === 'STAFF').length === 0 && <p>No staff yet.</p>}
        </div>
      </div>
    </div>
  );
}

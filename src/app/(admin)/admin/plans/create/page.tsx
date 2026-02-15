'use client';

import { useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export default function AdminPlanCreatePage() {
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState('100');
  const [maxAmount, setMaxAmount] = useState('1000');
  const [roiType, setRoiType] = useState('FIXED');
  const [roiValue, setRoiValue] = useState('0.01');
  const [durationDays, setDurationDays] = useState('30');
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>('');

  async function onSubmit() {
    setSaved(false);
    setError('');

    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        min_amount: minAmount,
        max_amount: maxAmount,
        roi_type: roiType,
        roi_value: roiValue,
        duration_days: durationDays,
        is_active: isActive
      }),
      credentials: 'include'
    });

    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      const msg =
        data?.message ??
        (data?.errors ? Object.values(data.errors).flat().filter(Boolean).join(' ') : null) ??
        data?.error ??
        `Failed to create plan (HTTP ${res.status}).`;
      setError(String(msg));
      return;
    }

    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investment Plan Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Create plan</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Plan name" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Min amount" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Max amount" />
        <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={roiType} onChange={e => setRoiType(e.target.value)}>
          <option value="FIXED">FIXED</option>
          <option value="VARIABLE">VARIABLE</option>
          <option value="ADMIN_MANUAL">ADMIN_MANUAL</option>
        </select>
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={roiValue} onChange={e => setRoiValue(e.target.value)} placeholder="ROI value" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="Duration days" />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
        </label>
        <button onClick={onSubmit} className="rounded-full border border-white/10 px-4 py-2 text-sm">Create plan</button>
        {error && <p className="text-xs text-rose-200">{error}</p>}
        {saved && !error && <p className="text-xs text-cyan-200">Plan created. Return to Plans to see it listed.</p>}
      </div>
    </div>
  );
}

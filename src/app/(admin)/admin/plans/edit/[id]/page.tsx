'use client';

import { use, useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export default function AdminPlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [roiType, setRoiType] = useState('FIXED');
  const [roiValue, setRoiValue] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/plans/${id}`)
      .then(res => safeJsonClient<any>(res))
      .then(data => {
        const plan = data?.plan;
        if (!plan) return;
        setName(plan.name);
        setMinAmount(plan.min_amount);
        setMaxAmount(plan.max_amount);
        setRoiType(plan.roi_type);
        setRoiValue(plan.roi_value);
        setDurationDays(String(plan.duration_days));
        setIsActive(plan.is_active);
      });
  }, [id]);

  async function onSave() {
    setSaved(false);
    setError('');
    const min = Number(minAmount);
    const max = Number(maxAmount);
    const roi = Number(roiValue);
    if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
      setError('Min amount must be less than or equal to max amount.');
      return;
    }
    if ((roiType === 'FIXED' || roiType === 'VARIABLE') && (!roiValue || roi <= 0)) {
      setError('ROI must be greater than 0 for FIXED/VARIABLE plans.');
      return;
    }
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: 'PUT',
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
        'Failed to save plan.';
      setError(String(msg));
      return;
    }
    setSaved(true);
  }

  async function onDelete() {
    if (!confirm('Archive this plan? It will be disabled and hidden.')) return;
    const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await safeJsonClient<any>(res);
      setError(data?.message ?? data?.error ?? 'Failed to archive plan.');
      return;
    }
    window.location.href = '/admin/plans';
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investment Plan Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Edit plan</h1>
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
        <div className="flex gap-2">
          <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save changes</button>
          <button onClick={onDelete} className="rounded-full border border-white/10 px-4 py-2 text-sm text-red-300">Delete plan</button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
        {saved && <p className="text-xs text-cyan-200">Plan saved</p>}
      </div>
    </div>
  );
}

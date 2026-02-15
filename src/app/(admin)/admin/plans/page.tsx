import Link from 'next/link';
import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function AdminPlansPage() {
  const res = await serverFetch('/api/admin/plans');
  const payload = await safeJson<{ ok: boolean; data: Array<{ id: string; name: string; min_amount: string; max_amount: string; roi_value: string; duration_days: number; is_active: boolean }> }>(res);
  const plans = payload?.data ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investment Plans</p>
        <h1 className="mt-2 text-2xl font-semibold">Plans</h1>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/plans/create" className="rounded-full border border-white/10 px-4 py-1">Create plan</Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3 text-sm text-slate-300">
          {plans.map(plan => (
            <div key={plan.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-white">{plan.name}</p>
                <p className="text-xs text-slate-400">ROI {plan.roi_value} · {plan.duration_days} days</p>
              </div>
              <span>${plan.min_amount} - ${plan.max_amount}</span>
              <Link href={`/admin/plans/edit/${plan.id}`} className="rounded-full border border-white/10 px-3 py-1 text-xs">Edit</Link>
            </div>
          ))}
          {plans.length === 0 && <p>No plans yet.</p>}
        </div>
      </div>
    </div>
  );
}

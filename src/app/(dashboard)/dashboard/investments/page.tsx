import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { InvestmentSubscribe } from '@/ui/components/investment-subscribe';

export default async function InvestmentsPage() {
  const plansRes = await serverFetch('/api/investments/plans');
  const positionsRes = await serverFetch('/api/investments/my');

  const plansPayload = await safeJson<{ ok: boolean; plans: Array<{ id: string; name: string; min_amount: string; max_amount: string; roi_value: string }> }>(plansRes);
  const positionsPayload = await safeJson<{
    ok: boolean;
    positions: Array<{ id: string; invested_amount: string; status: string; InvestmentPlan?: { name: string } | null }>;
  }>(positionsRes);

  const plans = plansPayload?.plans ?? [];
  const positions = positionsPayload?.positions ?? [];

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investments</p>
        <h1 className="mt-2 text-2xl font-semibold">Active positions</h1>
      </div>

      <InvestmentSubscribe
        plans={plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          min_amount: plan.min_amount.toString(),
          max_amount: plan.max_amount.toString()
        }))}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {positions.map(pos => (
          <div key={pos.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-cyan-200">{pos.InvestmentPlan?.name ?? 'Plan'}</p>
            <p className="mt-2 text-sm text-slate-300">Invested: ${pos.invested_amount.toString()}</p>
            <p className="mt-2 text-sm text-slate-300">Status: {pos.status}</p>
          </div>
        ))}
        {positions.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No active positions yet.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Available plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plans.map(plan => (
            <div key={plan.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-2 text-sm text-slate-300">Min: ${plan.min_amount.toString()}</p>
              <p className="text-sm text-slate-300">Max: ${plan.max_amount.toString()}</p>
              <p className="text-sm text-slate-300">ROI: {plan.roi_value.toString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

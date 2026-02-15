'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

type Plan = {
  id: string;
  name: string;
  min_amount: string;
  max_amount: string;
};

export function InvestmentSubscribe({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const planId = String(formData.get('planId') || '');
    const amount = String(formData.get('amount') || '');
    const acceptTerms = accepted;

    if (!acceptTerms) {
      setLoading(false);
      setMessage('Please review and accept the agreement first.');
      return;
    }

    const res = await fetch('/api/investments/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, amount, acceptTerms })
    });
    const data = await res.json().catch(() => ({}));
    const errorText = data?.errors && typeof data.errors === 'object'
      ? Object.values(data.errors).flat().join(', ')
      : data?.message;
    if (res.ok) {
      setMessage(
        `Subscribed to plan (#${data.position?.id ?? 'new'}). Main balance: $${data.mainBalance ?? '0'}`
      );
      router.refresh();
    } else {
      setMessage(errorText || 'Failed to subscribe');
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">Start a new investment</h2>
      <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
        <p>Profit is not guaranteed. Returns depend on business performance.</p>
        <p className="mt-1">Business risk disclosure: losses can occur, including partial or full capital loss.</p>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr_auto]" onSubmit={handleSubmit}>
        <select name="planId" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" required>
          <option value="">Select a plan</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name} (${plan.min_amount} - ${plan.max_amount})
            </option>
          ))}
        </select>
        <Input name="amount" placeholder="Amount" required />
        <Button disabled={loading}>Subscribe</Button>
        <div className="md:col-span-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => setShowAgreement(true)}
            className="rounded-full border border-white/10 px-3 py-1"
          >
            Review Agreement
          </button>
          <span className={accepted ? 'text-emerald-300' : 'text-amber-200'}>
            {accepted ? 'Agreement accepted' : 'Agreement not accepted'}
          </span>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}

      {showAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1224] p-5 text-sm text-slate-200">
            <h3 className="text-lg font-semibold text-white">Investment Agreement</h3>
            <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
              <p>Profit is not guaranteed and may vary based on real business outcomes.</p>
              <p>Business risk disclosure: investment can lose value, including partial or full capital loss.</p>
              <p>By accepting, you confirm you understand the risk profile and agree to platform investment terms.</p>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAgreement(false)}
                className="rounded-full border border-white/10 px-4 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccepted(true);
                  setShowAgreement(false);
                }}
                className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-1.5 text-emerald-200"
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

export function KycSubmitForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const documentType = String(formData.get('documentType') || 'PASSPORT');
    const documentFrontUrl = String(formData.get('documentFrontUrl') || '');
    const documentBackUrl = String(formData.get('documentBackUrl') || '');
    const selfieUrl = String(formData.get('selfieUrl') || '');

    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType,
        documentFrontUrl,
        documentBackUrl: documentBackUrl || undefined,
        selfieUrl
      })
    });

    const data = await res.json().catch(() => ({}));
    const errorText = data?.errors && typeof data.errors === 'object'
      ? Object.values(data.errors).flat().join(', ')
      : data?.message;
    setMessage(res.ok ? 'KYC submitted for review' : errorText || 'Failed to submit KYC');
    setLoading(false);
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <select name="documentType" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
        <option value="PASSPORT">Passport</option>
        <option value="NID">National ID</option>
        <option value="DRIVING_LICENSE">Driving License</option>
      </select>
      <Input name="documentFrontUrl" placeholder="Document front URL" required />
      <Input name="documentBackUrl" placeholder="Document back URL (optional)" />
      <Input name="selfieUrl" placeholder="Selfie URL" required />
      <Button className="rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-900" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit KYC'}
      </Button>
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </form>
  );
}

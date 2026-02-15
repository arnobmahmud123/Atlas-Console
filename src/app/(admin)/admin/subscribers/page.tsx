'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then(res => safeJsonClient<any>(res))
      .then(data => setSubscribers(data.subscribers ?? []))
      .catch(() => setSubscribers([]));
  }, []);

  async function addSubscriber() {
    const res = await fetch('/api/admin/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = (await safeJsonClient<any>(res)) ?? {};
    setSubscribers(data.subscribers ?? []);
    setEmail('');
  }

  async function sendMessage() {
    setSent(false);
    await fetch('/api/admin/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message })
    });
    setSent(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">All Subscribers</p>
        <h1 className="mt-2 text-2xl font-semibold">Newsletter audience</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            placeholder="Add email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button onClick={addSubscriber} className="rounded-full border border-white/10 px-4 py-2 text-sm">
            Add
          </button>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          {subscribers.map(item => (
            <div key={item} className="rounded-xl border border-white/10 bg-black/40 p-3">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <textarea
          className="h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={sendMessage} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Send message
        </button>
        {sent && <p className="text-xs text-cyan-200">Sent</p>}
      </div>
    </div>
  );
}

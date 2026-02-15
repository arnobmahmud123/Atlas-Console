'use client';

import { useState } from 'react';

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function onSend() {
    setSent(false);
    await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    });
    setSent(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Notification System</p>
        <h1 className="mt-2 text-2xl font-semibold">Broadcast message</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <textarea className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />
        <button onClick={onSend} className="rounded-full border border-white/10 px-4 py-2 text-sm">Send to all users</button>
        {sent && <p className="text-xs text-cyan-200">Broadcast sent</p>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

type Template = { key: string; subject: string; body: string };

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/email-templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  function updateTemplate(index: number, field: keyof Template, value: string) {
    setTemplates(prev => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Email Templates</p>
        <h1 className="mt-2 text-2xl font-semibold">Template library</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        {templates.map((t, i) => (
          <div key={t.key} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
            <input
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={t.subject}
              onChange={e => updateTemplate(i, 'subject', e.target.value)}
            />
            <textarea
              className="h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={t.body}
              onChange={e => updateTemplate(i, 'body', e.target.value)}
            />
          </div>
        ))}
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save templates
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { ThemeShell } from '../theme-shell';

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await serverFetch(`/api/public/pages?slug=${slug}`);
  const payload = await safeJson<{ ok: boolean; page: { slug: string; title: string; content: string } | null }>(res);
  const page = payload?.page ?? null;

  if (!page) {
    notFound();
  }

  return (
    <ThemeShell>
      <main className="min-h-screen bg-[#0a0b10] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-3xl font-semibold">{page.title}</h1>
          <div className="prose prose-invert mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </main>
    </ThemeShell>
  );
}

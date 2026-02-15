import Link from 'next/link';

export default function AdminCmsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">CMS</p>
        <h1 className="mt-2 text-2xl font-semibold">Website management</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/cms/pages" className="rounded-full border border-white/10 px-4 py-1">Pages</Link>
        <Link href="/admin/cms/seo" className="rounded-full border border-white/10 px-4 py-1">SEO</Link>
        <Link href="/admin/cms/theme" className="rounded-full border border-white/10 px-4 py-1">Theme</Link>
      </div>
    </div>
  );
}

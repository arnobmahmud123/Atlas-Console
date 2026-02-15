import Link from 'next/link';

export default function AdminInvestmentsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Investment Logs</p>
        <h1 className="mt-2 text-2xl font-semibold">Investments</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/investments/all" className="rounded-full border border-white/10 px-4 py-1">All</Link>
        <Link href="/admin/investments/active" className="rounded-full border border-white/10 px-4 py-1">Active</Link>
        <Link href="/admin/investments/completed" className="rounded-full border border-white/10 px-4 py-1">Completed</Link>
      </div>
    </div>
  );
}

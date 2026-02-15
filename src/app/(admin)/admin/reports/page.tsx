import Link from 'next/link';

export default function AdminReportsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Reports & Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold">Reports</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/reports/financial" className="rounded-full border border-white/10 px-4 py-1">Financial</Link>
        <Link href="/admin/reports/users" className="rounded-full border border-white/10 px-4 py-1">Users</Link>
        <Link href="/admin/reports/investments" className="rounded-full border border-white/10 px-4 py-1">Investments</Link>
      </div>
    </div>
  );
}

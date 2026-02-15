import Link from 'next/link';

export default function AdminDepositsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Deposits</p>
        <h1 className="mt-2 text-2xl font-semibold">Deposit management</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/deposits/pending" className="rounded-full border border-white/10 px-4 py-1">Pending</Link>
        <Link href="/admin/deposits/history" className="rounded-full border border-white/10 px-4 py-1">History</Link>
        <Link href="/accountant/deposits" className="rounded-full border border-white/10 px-4 py-1">Accountant Queue</Link>
        <Link href="/admin/manual-approvals/deposits" className="rounded-full border border-white/10 px-4 py-1">Manual Final</Link>
      </div>
    </div>
  );
}

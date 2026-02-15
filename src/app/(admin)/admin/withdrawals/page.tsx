import Link from 'next/link';

export default function AdminWithdrawalsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Withdrawals</p>
        <h1 className="mt-2 text-2xl font-semibold">Withdrawal management</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/withdrawals/pending" className="rounded-full border border-white/10 px-4 py-1">Pending</Link>
        <Link href="/admin/withdrawals/history" className="rounded-full border border-white/10 px-4 py-1">History</Link>
        <Link href="/accountant/withdrawals" className="rounded-full border border-white/10 px-4 py-1">Accountant Queue</Link>
        <Link href="/admin/manual-approvals/withdrawals" className="rounded-full border border-white/10 px-4 py-1">Manual Final</Link>
      </div>
    </div>
  );
}

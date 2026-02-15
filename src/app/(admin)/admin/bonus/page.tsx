import Link from 'next/link';

export default function AdminBonusLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Bonus / Rewards</p>
        <h1 className="mt-2 text-2xl font-semibold">Bonus management</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/bonus/referral" className="rounded-full border border-white/10 px-4 py-1">Referral Bonus</Link>
        <Link href="/admin/bonus/signup" className="rounded-full border border-white/10 px-4 py-1">Signup Bonus</Link>
        <Link href="/admin/bonus/ranking" className="rounded-full border border-white/10 px-4 py-1">Ranking Bonus</Link>
      </div>
    </div>
  );
}

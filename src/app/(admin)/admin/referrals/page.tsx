import Link from 'next/link';

export default function AdminReferralsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Referral System</p>
        <h1 className="mt-2 text-2xl font-semibold">Referral management</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/referrals/tree" className="rounded-full border border-white/10 px-4 py-1">Referral tree</Link>
        <Link href="/admin/referrals/commissions" className="rounded-full border border-white/10 px-4 py-1">Commission config</Link>
      </div>
    </div>
  );
}

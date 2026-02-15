import Link from 'next/link';

export default function AdminKycPage() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">KYC Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Verification queue</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/kyc/pending" className="rounded-full border border-white/10 px-4 py-1">Pending</Link>
        <Link href="/admin/kyc/approved" className="rounded-full border border-white/10 px-4 py-1">Approved</Link>
        <Link href="/admin/kyc/rejected" className="rounded-full border border-white/10 px-4 py-1">Rejected</Link>
        <Link href="/admin/kyc/settings" className="rounded-full border border-white/10 px-4 py-1">Settings</Link>
      </div>
    </div>
  );
}

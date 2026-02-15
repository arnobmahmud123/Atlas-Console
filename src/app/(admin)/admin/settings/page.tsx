import Link from 'next/link';

export default function AdminSettingsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">System Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">Settings</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/settings/general" className="rounded-full border border-white/10 px-4 py-1">General</Link>
        <Link href="/admin/settings/payment-gateways" className="rounded-full border border-white/10 px-4 py-1">Payment Gateways</Link>
        <Link href="/admin/settings/security" className="rounded-full border border-white/10 px-4 py-1">Security</Link>
        <Link href="/admin/settings/cctv" className="rounded-full border border-white/10 px-4 py-1">CCTV</Link>
      </div>
    </div>
  );
}

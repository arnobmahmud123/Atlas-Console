import Link from 'next/link';

export default function AdminNotificationsLanding() {
  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Notification System</p>
        <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/notifications/email" className="rounded-full border border-white/10 px-4 py-1">Email</Link>
        <Link href="/admin/notifications/sms" className="rounded-full border border-white/10 px-4 py-1">SMS</Link>
        <Link href="/admin/notifications/broadcast" className="rounded-full border border-white/10 px-4 py-1">Broadcast</Link>
      </div>
    </div>
  );
}

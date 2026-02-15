import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import Link from 'next/link';
import { UserMetrics } from '@/ui/components/user-metrics';
import { UserActivity } from '@/ui/components/user-activity';
import { GlowingLineChart } from '@/ui/components/glowing-line-chart';
import { PieChart } from '@/ui/components/pie-chart';
import { BarChart } from '@/ui/components/bar-chart';
import { formatCompactUsd, toFullUsd } from '@/lib/format/currency';
import { ProfitPeriodSummary } from '@/ui/components/profit-period-summary';

export default async function DashboardPage() {
  const [res, announcementsRes] = await Promise.all([serverFetch('/api/user/dashboard'), serverFetch('/api/announcements')]);
  const payload = await safeJson<{
    ok: boolean;
    data: {
      deposits: number;
      withdrawals: number;
      positions: number;
      balance: string;
      recentTx: Array<{ id: string; type: string; status: string; amount: string; created_at: string }>;
      kyc: { status?: string } | null;
      profileMap: Record<string, { name: string; phone: string; address: string }>;
      todayProfitStatus: 'CREDITED' | 'NO_CREDIT';
      todayProfit: string;
      lastProfitAmount: string;
      lastProfitAt: string | null;
      totalEarnings: string;
      referralEarnings: string;
    };
  }>(res);
  const announcementsPayload = await safeJson<{
    ok: boolean;
    data: Array<{ id: string; title: string; type: 'GENERAL' | 'PROFIT_DELAY' | 'MAINTENANCE'; published_at: string }>;
  }>(announcementsRes);

  const data = payload?.data ?? {
    deposits: 0,
    withdrawals: 0,
    positions: 0,
    balance: '0',
    recentTx: [],
    kyc: null,
    profileMap: {},
    todayProfitStatus: 'NO_CREDIT' as const,
    todayProfit: '0',
    lastProfitAmount: '0',
    lastProfitAt: null,
    totalEarnings: '0',
    referralEarnings: '0'
  };
  const announcements = announcementsPayload?.data ?? [];

  const profile = Object.values(data.profileMap)[0] ?? null;
  const displayName = profile?.name ?? 'Demo User';
  const initials = displayName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const kycStatus = data.kyc?.status ?? 'NOT_SUBMITTED';
  const kycBadgeClass =
    kycStatus === 'APPROVED'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
      : kycStatus === 'REJECTED'
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  const kycTooltip =
    kycStatus === 'APPROVED'
      ? 'Verified and approved'
      : kycStatus === 'REJECTED'
      ? 'Rejected. Update documents.'
      : kycStatus === 'PENDING'
      ? 'Awaiting review'
      : 'Not submitted yet';

  const baseTrend = Math.max(1, Number(data.deposits) + Number(data.positions) * 2);
  const earningsSeries = Array.from({ length: 7 }).map((_, i) =>
    Math.round(baseTrend * (0.55 + i * 0.08) + (i % 2 === 0 ? 8 : 0))
  );
  const activitySeries = Array.from({ length: 7 }).map((_, i) =>
    Math.round(Number(data.withdrawals) * (0.4 + i * 0.06) + i * 3)
  );
  const allocationMix = [
    { label: 'Wallet', value: Number(data.balance) || 1 },
    { label: 'Active invests', value: Number(data.positions) || 1 },
    { label: 'Rewards', value: Math.max(1, Math.round(Number(data.deposits) * 0.2)) }
  ];

  return (
    <div className="space-y-6 text-white">
      <div className="bg-enterprise-header ui-surface rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Your dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Welcome back, {displayName}</h1>
            <p className="mt-2 text-sm text-slate-300">Your ledger, rewards, and investment pulse at a glance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/wallets" className="bg-card-accent ui-surface rounded-full px-4 py-2 text-xs">Fund wallet</Link>
            <Link href="/dashboard/investments" className="bg-card-accent ui-surface rounded-full px-4 py-2 text-xs">New investment</Link>
            <Link href="/dashboard/kyc" className="bg-card-accent ui-surface rounded-full px-4 py-2 text-xs">Verify identity</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Main wallet balance', value: formatCompactUsd(data.balance), fullValue: toFullUsd(data.balance) },
            { label: 'Active investments', value: data.positions },
            { label: 'Deposits', value: data.deposits },
            { label: 'Withdrawals paid', value: data.withdrawals }
          ].map(item => (
            <div key={item.label} className="bg-card-navy ui-surface rounded-2xl p-4">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p title={item.fullValue ?? String(item.value)} className="mt-2 truncate text-2xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/40 to-blue-500/30 text-lg font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm text-slate-400">Profile</p>
              <p className="text-white">{displayName}</p>
              <p className="text-xs text-slate-400">user@example.com</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Phone</span>
              <span>{profile?.phone ?? '+1 (555) 201-1044'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Address</span>
              <span>{profile?.address ?? '312 Market St, San Francisco'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>KYC status</span>
              <span title={kycTooltip} className={`rounded-full border px-3 py-1 text-xs ${kycBadgeClass}`}>
                {kycStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card-steel ui-surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Today&apos;s profit status</p>
          <p className={`mt-2 text-sm font-semibold ${data.todayProfitStatus === 'CREDITED' ? 'text-emerald-200' : 'text-amber-200'}`}>
            {data.todayProfitStatus === 'CREDITED' ? 'Credited' : 'Pending'}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatCompactUsd(data.todayProfit)}</p>
        </div>
        <div className="bg-card-steel ui-surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Last credited profit</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCompactUsd(data.lastProfitAmount)}</p>
          <p className="mt-1 text-xs text-slate-400">{data.lastProfitAt ? new Date(data.lastProfitAt).toLocaleString() : 'No credit yet'}</p>
        </div>
        <div className="bg-card-steel ui-surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total earnings</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCompactUsd(data.totalEarnings)}</p>
        </div>
        <div className="bg-card-steel ui-surface rounded-2xl p-4">
          <p className="text-xs text-slate-400">Referral earnings</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCompactUsd(data.referralEarnings)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-300">
            <Link href="/dashboard/wallets" className="bg-card-navy ui-surface rounded-2xl p-4">Wallets</Link>
            <Link href="/dashboard/investments" className="bg-card-navy ui-surface rounded-2xl p-4">Investments</Link>
            <Link href="/dashboard/referrals" className="bg-card-navy ui-surface rounded-2xl p-4">Referrals</Link>
            <Link href="/dashboard/payments" className="bg-card-navy ui-surface rounded-2xl p-4">Payments</Link>
            <Link href="/dashboard/kyc" className="bg-card-navy ui-surface rounded-2xl p-4">KYC</Link>
            <Link href="/dashboard" className="bg-card-navy ui-surface rounded-2xl p-4">Account</Link>
          </div>
        </div>

        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {data.recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <p className="text-white">{tx.type}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span>${tx.amount.toString()}</span>
                <span
                  title={tx.status === 'SUCCESS' ? 'Completed successfully' : tx.status === 'FAILED' ? 'Failed or reversed' : 'Pending review'}
                  className={`rounded-full border px-3 py-1 text-xs ${tx.status === 'SUCCESS' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : tx.status === 'FAILED' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}
                >
                  {tx.status}
                </span>
              </div>
            ))}
            {data.recentTx.length === 0 && <p>No transactions yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-card-navy ui-surface rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Announcement board</h2>
          <Link href="/dashboard/announcements" className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/10">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {announcements.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="truncate">{item.title}</span>
              <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{item.type}</span>
            </div>
          ))}
          {announcements.length === 0 ? <p>No active notices.</p> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card-navy ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Account status</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Active investments</span>
              <span>{data.positions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Deposits</span>
              <span>{data.deposits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Withdrawals</span>
              <span>{data.withdrawals}</span>
            </div>
          </div>
        </div>

        <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Earnings outlook</h2>
          <p className="mt-2 text-sm text-slate-300">Upcoming rewards and ledger activity snapshot.</p>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Next reward</span>
              <span>02:14:56</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Projected ROI</span>
              <span>+2.6% / day</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Referral earnings</span>
              <span>{formatCompactUsd(data.referralEarnings)}</span>
            </div>
          </div>
        </div>
      </div>

      <UserMetrics />
      <ProfitPeriodSummary />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlowingLineChart title="Earnings momentum" values={earningsSeries} accent="#facc15" />
        <GlowingLineChart title="Withdrawal cadence" values={activitySeries} accent="#f97316" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PieChart title="Portfolio mix" points={allocationMix} colors={['#22d3ee', '#34d399', '#facc15']} />
        <BarChart title="Deposit streak" values={earningsSeries} color="from-cyan-400 to-blue-500" />
        <BarChart title="Withdrawal streak" values={activitySeries} color="from-amber-400 to-rose-400" />
      </div>

      <UserActivity />
    </div>
  );
}

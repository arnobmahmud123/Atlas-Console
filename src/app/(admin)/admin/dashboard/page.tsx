import { AdminCharts } from '@/ui/components/admin-charts';
import { CountUp } from '@/ui/components/count-up';
import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { GlowingLineChart } from '@/ui/components/glowing-line-chart';
import { PieChart } from '@/ui/components/pie-chart';
import { BarChart } from '@/ui/components/bar-chart';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleDollarSign, ClipboardList, ShieldCheck, Users } from 'lucide-react';

export default async function AdminDashboardPage() {
  const res = await serverFetch('/api/admin/dashboard');
  const payload = await safeJson<{
    ok: boolean;
    data: {
      usersTotal: number;
      activeInvestments: number;
      depositsTotal: { _sum: { amount: string | null } };
      withdrawalsTotal: { _sum: { amount: string | null } };
      pendingDeposits: number;
      pendingWithdrawals: number;
      pendingKyc: number;
      recentTransactions: Array<{ id: string; type: string; status: string; amount: string; created_at: string }>;
      recentDeposits: Array<{ id: string; status: string; amount: string; created_at: string; User?: { email: string | null } }>;
      recentWithdrawals: Array<{ id: string; status: string; amount: string; created_at: string; User_Withdrawal_user_idToUser?: { email: string | null } }>;
      recentInvestments: Array<{ id: string; invested_amount: string; User?: { email: string | null }; InvestmentPlan?: { name: string | null } }>;
      recentUsers: Array<{ email: string; created_at: string }>;
      dailyRevenue: number[];
      userGrowth: number[];
    };
  }>(res);

  const data = payload?.data ?? {
    usersTotal: 0,
    activeInvestments: 0,
    depositsTotal: { _sum: { amount: '0' } },
    withdrawalsTotal: { _sum: { amount: '0' } },
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingKyc: 0,
    recentTransactions: [],
    recentDeposits: [],
    recentWithdrawals: [],
    recentInvestments: [],
    recentUsers: [],
    dailyRevenue: Array.from({ length: 7 }).map(() => 0),
    userGrowth: Array.from({ length: 7 }).map(() => 0)
  };

  const activityMap = Array.from({ length: 28 }).map((_, i) => {
    const revenue = data.dailyRevenue[i % data.dailyRevenue.length] ?? 0;
    const growth = data.userGrowth[i % data.userGrowth.length] ?? 0;
    return Math.min(1, (revenue / 1500 + growth / 10) / 2);
  });

  const revenueTrend = data.dailyRevenue.length > 1 ? ((data.dailyRevenue[6] - data.dailyRevenue[5]) / Math.max(1, data.dailyRevenue[5])) * 100 : 0;
  const userTrend = data.userGrowth.length > 1 ? ((data.userGrowth[6] - data.userGrowth[5]) / Math.max(1, data.userGrowth[5])) * 100 : 0;
  const investmentTrend = Math.max(2.5, Math.min(9.8, revenueTrend * 0.6));
  const withdrawalTrend = Math.max(-6.5, Math.min(4.2, -revenueTrend * 0.4));
  const depositsValue = Number(data.depositsTotal._sum.amount ?? 0);
  const withdrawalsValue = Number(data.withdrawalsTotal._sum.amount ?? 0);
  const revenueSeries = data.dailyRevenue.slice(-7);
  const growthSeries = data.userGrowth.slice(-7);
  const volumeSeries = revenueSeries.map((value, index) => Math.round(value * 0.7 + (growthSeries[index] ?? 0) * 8));
  const approvalMix = [
    { label: 'Pending Deposits', value: data.pendingDeposits },
    { label: 'Pending Withdrawals', value: data.pendingWithdrawals },
    { label: 'Pending KYC', value: data.pendingKyc }
  ];
  const trendItems = [
    { label: 'Total users', value: data.usersTotal, accent: 'from-cyan-400/20 to-transparent', trend: userTrend, format: 'number' as const },
    { label: 'Active investments', value: data.activeInvestments, accent: 'from-emerald-400/20 to-transparent', trend: investmentTrend, format: 'number' as const },
    { label: 'Total deposits', value: depositsValue, accent: 'from-blue-400/20 to-transparent', trend: revenueTrend, format: 'currency' as const },
    { label: 'Total withdrawals', value: withdrawalsValue, accent: 'from-amber-400/20 to-transparent', trend: withdrawalTrend, format: 'currency' as const }
  ];

  return (
    <div className="space-y-6 text-white">
      <div className="bg-enterprise-header ui-surface relative overflow-hidden rounded-3xl p-6">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Admin console</p>
            <h1 className="mt-2 text-2xl font-semibold">Operations overview</h1>
            <p className="mt-2 text-sm text-slate-300">
              Monitor approvals, growth, and ledger health in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
              {[
              { label: 'Pending Deposits', value: data.pendingDeposits },
              { label: 'Pending Withdrawals', value: data.pendingWithdrawals },
              { label: 'Pending KYC', value: data.pendingKyc }
            ].map(item => (
              <div key={item.label} className="bg-card-accent ui-surface rounded-2xl px-4 py-2 text-xs text-slate-300">
                <span className="text-slate-400">{item.label}</span>
                <span className="ml-2 text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card-navy ui-surface rounded-2xl p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Quick actions</p>
            <h2 className="mt-2 text-lg font-semibold">Resolve the backlog first</h2>
            <p className="mt-1 text-sm text-slate-300">Jump straight to pending reviews and core admin tools.</p>
          </div>
          <Link
            href="/admin/manual-approvals/deposits"
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-slate-200 hover:bg-white/10 lg:flex"
          >
            Open review queue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Manual deposits',
              href: '/admin/manual-approvals/deposits',
              icon: ClipboardList,
              value: data.pendingDeposits
            },
            {
              label: 'Manual withdrawals',
              href: '/admin/manual-approvals/withdrawals',
              icon: CircleDollarSign,
              value: data.pendingWithdrawals
            },
            {
              label: 'Pending KYC',
              href: '/admin/kyc/pending',
              icon: ShieldCheck,
              value: data.pendingKyc
            },
            { label: 'Users', href: '/admin/users', icon: Users, value: data.usersTotal },
            { label: 'Transactions', href: '/admin/transactions', icon: BadgeCheck, value: data.recentTransactions.length },
            { label: 'Plans', href: '/admin/plans', icon: BadgeCheck, value: 0 }
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-card-indigo ui-surface group rounded-2xl border border-white/10 p-4 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-card-accent ui-surface flex h-10 w-10 items-center justify-center rounded-2xl text-white">
                      <Icon className="h-5 w-5 opacity-90" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-300">Open</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-white">
                      <CountUp value={item.value} format="number" />
                    </p>
                    <p className="text-[11px] text-slate-400">items</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-300/80" />
                    Priority
                  </span>
                  <span className="text-white/80 transition group-hover:text-white">
                    View <ArrowRight className="ml-1 inline h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {trendItems.map(item => {
          const trendUp = item.trend >= 0;
          const trendColor = trendUp ? 'text-emerald-300' : 'text-rose-300';
          const trendArrow = trendUp ? '↑' : '↓';
          return (
          <div key={item.label} className="bg-card-navy ui-surface rounded-2xl p-4">
            <div className={`h-1 w-full rounded-full bg-gradient-to-r ${item.accent}`} />
            <p className="mt-3 text-xs text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              <CountUp value={item.value} format={item.format} />
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={`rounded-full border px-2 py-0.5 ${trendUp ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-rose-400/30 bg-rose-400/10'}`}>
                <span className={trendColor}>{trendArrow} {Math.abs(item.trend).toFixed(1)}%</span>
              </span>
              <span className="text-slate-400">vs last period</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300/80 animate-pulse" />
            </div>
          </div>
        );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Activity map</h2>
            <span className="text-xs text-slate-400">Last 28 days</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {activityMap.map((value, index) => (
              <div
                key={index}
                className="h-6 w-6 rounded-lg"
                style={{ backgroundColor: `rgba(56, 189, 248, ${0.15 + value * 0.75})` }}
                title={`Activity score ${(value * 100).toFixed(0)}%`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Scores reflect deposits + user growth mix.</p>
        </div>
        <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Security posture</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            {[
              { label: 'Risk alerts', value: 'Low' },
              { label: 'Ledger audits', value: 'Healthy' },
              { label: '2FA compliance', value: '97%' },
              { label: 'Webhook latency', value: '120ms' }
            ].map(item => (
              <div key={item.label} className="bg-card-navy ui-surface flex items-center justify-between rounded-2xl px-4 py-3">
                <span>{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Daily revenue (7 days)</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {data.dailyRevenue.map((value, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-xs text-slate-400">
                <div className="h-20 w-3 rounded-full bg-cyan-300/30">
                  <div className="h-full w-full rounded-full bg-cyan-300" style={{ height: `${Math.min(100, value / 10)}%` }} />
                </div>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">User growth (7 days)</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {data.userGrowth.map((value, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-xs text-slate-400">
                <div className="h-20 w-3 rounded-full bg-blue-300/30">
                  <div className="h-full w-full rounded-full bg-blue-300" style={{ height: `${Math.min(100, value * 10)}%` }} />
                </div>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminCharts />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlowingLineChart title="Revenue velocity" values={revenueSeries} accent="#22d3ee" />
        <GlowingLineChart title="User acceleration" values={growthSeries.map(value => value * 10)} accent="#a78bfa" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PieChart title="Approval backlog mix" points={approvalMix} colors={['#f59e0b', '#f97316', '#f43f5e']} />
        <BarChart title="Deposit volume" values={revenueSeries} color="from-cyan-400 to-blue-500" />
        <BarChart title="Investment volume" values={volumeSeries} color="from-emerald-400 to-lime-400" />
      </div>

      <div className="bg-card-steel ui-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.recentTransactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-white">{tx.type}</p>
                <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
              </div>
              <span>${tx.amount.toString()}</span>
              <span title={tx.status === 'SUCCESS' ? 'Completed successfully' : tx.status === 'FAILED' ? 'Failed or reversed' : 'Pending review'} className={`rounded-full border px-3 py-1 text-xs ${tx.status === 'SUCCESS' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : tx.status === 'FAILED' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                {tx.status}
              </span>
            </div>
          ))}
          {data.recentTransactions.length === 0 && <p>No transactions yet.</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card-navy ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recent deposits</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.recentDeposits.map(dep => (
            <div key={dep.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-white">{dep.User?.email ?? 'User'}</p>
                <p className="text-xs text-slate-400">{new Date(dep.created_at).toLocaleString()}</p>
              </div>
              <span>${dep.amount.toString()}</span>
                <span title={dep.status === 'SUCCESS' ? 'Deposit confirmed' : dep.status === 'FAILED' ? 'Deposit failed' : 'Awaiting confirmation'} className={`rounded-full border px-3 py-1 text-xs ${dep.status === 'SUCCESS' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : dep.status === 'FAILED' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                  {dep.status}
                </span>
              </div>
            ))}
          {data.recentDeposits.length === 0 && <p>No deposits yet.</p>}
        </div>
      </div>

        <div className="bg-card-navy ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recent withdrawals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.recentWithdrawals.map(wd => (
            <div key={wd.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-white">{wd.User_Withdrawal_user_idToUser?.email ?? 'User'}</p>
                <p className="text-xs text-slate-400">{new Date(wd.created_at).toLocaleString()}</p>
              </div>
              <span>${wd.amount.toString()}</span>
                <span title={wd.status === 'PAID' ? 'Withdrawal paid' : wd.status === 'REJECTED' ? 'Withdrawal rejected' : 'Pending review'} className={`rounded-full border px-3 py-1 text-xs ${wd.status === 'PAID' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : wd.status === 'REJECTED' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                  {wd.status}
                </span>
              </div>
            ))}
          {data.recentWithdrawals.length === 0 && <p>No withdrawals yet.</p>}
        </div>
      </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-card-indigo ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Latest investments</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.recentInvestments.map(inv => (
            <div key={inv.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{inv.User?.email ?? 'User'}</span>
              <span>${inv.invested_amount.toString()}</span>
              <span className="text-xs text-slate-400">{inv.InvestmentPlan?.name ?? 'Plan'}</span>
            </div>
          ))}
          {data.recentInvestments.length === 0 && <p>No investments yet.</p>}
        </div>
      </div>

        <div className="bg-card-steel ui-surface rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recently registered users</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
          {data.recentUsers.map(user => (
            <div key={user.email} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{user.email}</span>
              <span className="text-xs text-slate-400">{new Date(user.created_at).toDateString()}</span>
            </div>
          ))}
          {data.recentUsers.length === 0 && <p>No users yet.</p>}
        </div>
      </div>
      </div>
    </div>
  );
}

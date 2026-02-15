import { serverFetch, safeJson } from '@/lib/http/server-fetch';

export default async function ReferralsPage() {
  const [statsRes, listRes, commissionsRes, meRes, myAllocationsRes] = await Promise.all([
    serverFetch('/api/referrals/stats'),
    serverFetch('/api/referrals/my'),
    serverFetch('/api/me/referral-commissions'),
    serverFetch('/api/me'),
    serverFetch('/api/me/profit-allocations')
  ]);

  const statsPayload = await safeJson<{ ok: boolean; data: { totalReferralEarnings: string; activeReferralLevels: number[]; commissionPerLevel: Record<string, string> } }>(statsRes);
  const listPayload = await safeJson<{ ok: boolean; data: Array<{ id: string; level: number; User_Referral_user_idToUser?: { email: string | null } }> }>(listRes);
  const commissionsPayload = await safeJson<{
    ok: boolean;
    totalEarnings: string;
    data: Array<{
      id: string;
      level: number;
      amount: string;
      percent: string;
      created_at: string;
      downline_user?: { email: string | null };
      event?: { source_type: string };
    }>;
  }>(commissionsRes);
  const mePayload = await safeJson<{ ok: boolean; user?: { id: string } }>(meRes);
  const myAllocationsPayload = await safeJson<{
    ok: boolean;
    data: Array<{
      id: string;
      batch: { id: string; period_type: string; period_start: string; period_end: string; status: string };
    }>;
  }>(myAllocationsRes);

  const stats = statsPayload?.data ?? { totalReferralEarnings: '0', activeReferralLevels: [], commissionPerLevel: {} };
  const referrals = listPayload?.data ?? [];
  const referralLink = `http://localhost:3000/register?ref=${encodeURIComponent(mePayload?.user?.id ?? '')}`;
  const totalEarnings = commissionsPayload?.totalEarnings ?? stats.totalReferralEarnings?.toString() ?? '0';
  const commissions = commissionsPayload?.data ?? [];
  const myReportBatches = Array.from(
    new Map(
      (myAllocationsPayload?.data ?? [])
        .filter(item => item.batch?.status === 'APPROVED')
        .map(item => [item.batch.id, item.batch])
    ).values()
  );

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Referrals</p>
        <h1 className="mt-2 text-2xl font-semibold">Referral performance</h1>
        <p className="mt-2 text-sm text-slate-300">
          Total referral earnings: ${totalEarnings}
        </p>
        <p className="mt-2 text-xs text-slate-400 break-all">Referral link: {referralLink}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Active levels</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
            {stats.activeReferralLevels.map(level => (
              <span key={level} className="rounded-full border border-white/10 px-3 py-1">
                Level {level}
              </span>
            ))}
            {stats.activeReferralLevels.length === 0 && <span>No referrals yet.</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Commission per level</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {Object.entries(stats.commissionPerLevel).map(([level, rate]) => (
              <div key={level} className="flex items-center justify-between">
                <span>Level {level}</span>
                <span>{rate.toString()}x</span>
              </div>
            ))}
            {Object.keys(stats.commissionPerLevel).length === 0 && <p>No commission data.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Commission history (Profit Distribution)</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {commissions.map(row => (
            <div key={row.id} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>
                L{row.level} | {row.event?.source_type === 'PROFIT_DISTRIBUTION' ? 'Profit Distribution' : row.event?.source_type}
              </span>
              <span className="text-right">
                +${row.amount}
                <span className="ml-2 text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</span>
              </span>
            </div>
          ))}
          {commissions.length === 0 && <p>No commission events yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">My profit period reports</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {['DAILY', 'WEEKLY', 'MONTHLY', 'HALF_YEARLY', 'YEARLY'].map(range => (
            <a key={range} href={`/api/reports/profit/period/me?range=${range}`} className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">
              {range} report
            </a>
          ))}
        </div>
        <form action="/api/reports/profit/period/me" method="GET" target="_blank" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input type="hidden" name="range" value="MONTHLY" />
          <input name="start" type="date" className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-white" />
          <input name="end" type="date" className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-white" />
          <button className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10">Custom Date Report</button>
        </form>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {myReportBatches.map(batch => (
            <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span>
                {batch.period_type} · {new Date(batch.period_start).toLocaleDateString()} - {new Date(batch.period_end).toLocaleDateString()}
              </span>
              <a href={`/api/reports/profit/${batch.id}/me`} className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/10">
                Download My Report
              </a>
            </div>
          ))}
          {myReportBatches.length === 0 ? <p>No approved profit reports yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

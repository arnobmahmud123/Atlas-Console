import { NextResponse } from 'next/server';
import { runDailyInvestmentRewards } from '@/jobs/daily-investment-rewards.job';

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-api-key');
  if (!secret || secret !== process.env.CRON_API_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await runDailyInvestmentRewards();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { buildProfitPeriodReport, type ProfitRange } from '@/services/profit-period-report.service';

export const runtime = 'nodejs';

const rangeSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'HALF_YEARLY', 'YEARLY']);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedRange = rangeSchema.safeParse(url.searchParams.get('range') ?? 'DAILY');
  if (!parsedRange.success) {
    return NextResponse.json({ ok: false, message: 'Invalid range' }, { status: 400 });
  }

  const anchorRaw = url.searchParams.get('anchor');
  const anchorDate = anchorRaw ? new Date(anchorRaw) : new Date();
  if (anchorRaw && Number.isNaN(anchorDate.getTime())) {
    return NextResponse.json({ ok: false, message: 'Invalid anchor date' }, { status: 400 });
  }
  const startRaw = url.searchParams.get('start');
  const endRaw = url.searchParams.get('end');
  const customStart = startRaw ? new Date(`${startRaw}T00:00:00.000Z`) : undefined;
  const customEnd = endRaw ? new Date(`${endRaw}T23:59:59.999Z`) : undefined;
  if (startRaw && Number.isNaN(customStart!.getTime())) {
    return NextResponse.json({ ok: false, message: 'Invalid start date' }, { status: 400 });
  }
  if (endRaw && Number.isNaN(customEnd!.getTime())) {
    return NextResponse.json({ ok: false, message: 'Invalid end date' }, { status: 400 });
  }
  if (customStart && customEnd && customStart > customEnd) {
    return NextResponse.json({ ok: false, message: 'Start date must be before end date' }, { status: 400 });
  }

  const report = await buildProfitPeriodReport({
    range: parsedRange.data as ProfitRange,
    scope: 'me',
    viewerUserId: session.user.id,
    anchorDate,
    customStart,
    customEnd
  });

  return new Response(report.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=\"my-${report.filename}\"`,
      'Cache-Control': 'no-store'
    }
  });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { buildProfitReport } from '@/services/profit-report.service';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const report = await buildProfitReport({ batchId, scope: 'me', viewerUserId: session.user.id });
  if (!report) {
    return NextResponse.json({ ok: false, message: 'Report not available' }, { status: 404 });
  }

  return new Response(report.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=\"my-${report.filename}\"`,
      'Cache-Control': 'no-store'
    }
  });
}

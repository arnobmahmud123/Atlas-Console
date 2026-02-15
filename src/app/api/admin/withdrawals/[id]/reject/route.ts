import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { rejectWithdrawal } from '@/services/withdrawal-review.service';
import { sanitizeString } from '@/lib/http/sanitize';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const parsed = z.preprocess(sanitizeString, z.string().uuid()).safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid withdrawal id'] } }, { status: 400 });
  }

  const result = await rejectWithdrawal({
    withdrawalId: id,
    reviewedBy: session.user.id
  });

  return NextResponse.json({ ok: true, message: 'Withdrawal rejected', withdrawal: result });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getWalletBalance } from '@/services/wallet.service';
import { sanitizeString } from '@/lib/http/sanitize';

const schema = z.object({
  walletType: z.preprocess(
    value => {
      const sanitized = sanitizeString(value);
      return typeof sanitized === 'string' ? sanitized.toUpperCase() : sanitized;
    },
    z.enum(['MAIN', 'PROFIT'])
  )
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({ walletType: searchParams.get('walletType') });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const balance = await getWalletBalance(session.user.id, parsed.data.walletType);

  return NextResponse.json({ ok: true, balance: balance.toString() });
}

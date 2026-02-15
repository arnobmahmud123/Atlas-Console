import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { submitKyc } from '@/services/kyc-submission.service';
import { sanitizeString } from '@/lib/http/sanitize';
import { prisma } from '@/database/prisma/client';

const schema = z.object({
  documentType: z.enum(['PASSPORT', 'NID', 'DRIVING_LICENSE']),
  documentFrontUrl: z.preprocess(sanitizeString, z.string().url()),
  documentBackUrl: z.preprocess(sanitizeString, z.string().url().optional()),
  selfieUrl: z.preprocess(sanitizeString, z.string().url())
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await submitKyc({
      userId: session.user.id,
      documentType: parsed.data.documentType,
      documentFrontUrl: parsed.data.documentFrontUrl,
      documentBackUrl: parsed.data.documentBackUrl,
      selfieUrl: parsed.data.selfieUrl
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Failed to submit KYC' },
      { status: 400 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const record = await prisma.kyc.findFirst({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' }
  });

  return NextResponse.json({ ok: true, data: record });
}

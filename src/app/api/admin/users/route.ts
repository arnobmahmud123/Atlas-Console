import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sanitizeString, zIntString, zSanitizedString } from '@/lib/http/sanitize';
import { hashPassword } from '@/modules/auth/services/password.service';
import crypto from 'crypto';

const querySchema = z.object({
  page: zIntString().optional(),
  limit: zIntString().optional(),
  status: zSanitizedString().optional()
});

const createSchema = z.object({
  email: z.preprocess(sanitizeString, z.string().email()),
  password: z.preprocess(sanitizeString, z.string().min(8)),
  role: z.preprocess(sanitizeString, z.enum(['USER', 'STAFF', 'ADMIN', 'ACCOUNTANT']))
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    status: searchParams.get('status') ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const status = parsed.data.status ?? 'all';
  const where =
    status === 'active'
      ? { is_active: true }
      : status === 'banned'
      ? { is_active: false }
      : status === 'unverified'
      ? { is_verified: false }
      : {};

  const page = Math.max(Number(parsed.data.page ?? '1'), 1);
  const limit = Math.min(Math.max(Number(parsed.data.limit ?? '20'), 1), 100);
  const skip = (page - 1) * limit;

  const [users, total, activeCount, bannedCount, unverifiedCount] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      where,
      select: { id: true, email: true, role: true, is_active: true, is_verified: true, created_at: true }
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { is_active: true } }),
    prisma.user.count({ where: { is_active: false } }),
    prisma.user.count({ where: { is_verified: false } })
  ]);

  return NextResponse.json({
    ok: true,
    data: users,
    pagination: { page, limit, total },
    stats: { active: activeCount, banned: bannedCount, unverified: unverifiedCount }
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let body: unknown;
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    body = {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      role: String(form.get('role') ?? '')
    };
  } else {
    return NextResponse.json({ ok: false, error: 'Unsupported content type' }, { status: 415 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: parsed.data.email,
      password_hash: passwordHash,
      role: parsed.data.role,
      updated_at: now
    }
  });

  return NextResponse.json({ ok: true, user });
}

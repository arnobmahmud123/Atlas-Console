import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sanitizeString } from '@/lib/http/sanitize';
import { verifyPassword } from '@/modules/auth/services/password.service';

const schema = z.object({
  newEmail: z.preprocess(sanitizeString, z.string().email()),
  currentPassword: z.preprocess(sanitizeString, z.string().min(8).max(200))
});

export async function PUT(request: Request) {
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, password_hash: true }
  });
  if (!user?.password_hash) {
    return NextResponse.json({ ok: false, message: 'Password login not enabled for this account' }, { status: 400 });
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.password_hash);
  if (!ok) {
    return NextResponse.json({ ok: false, message: 'Current password is incorrect' }, { status: 400 });
  }

  const newEmail = parsed.data.newEmail.toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ ok: true, message: 'Email unchanged' });
  }

  const exists = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ ok: false, message: 'Email already in use' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: newEmail, updated_at: new Date() }
  });

  // NextAuth JWT will still carry old email until next sign-in.
  return NextResponse.json({ ok: true, message: 'Email updated. Please logout and login again.' });
}


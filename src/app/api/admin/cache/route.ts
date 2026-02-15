import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { revalidatePath } from 'next/cache';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.flushAll();
    await client.disconnect();
  } catch {
    // ignore redis errors
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return NextResponse.json({ ok: true });
}

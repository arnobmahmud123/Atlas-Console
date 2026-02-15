import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      is_verified: true,
      created_at: true,
      UserProfile: {
        select: { full_name: true, phone: true, address: true, avatar_url: true }
      }
    }
  });

  return NextResponse.json({ ok: true, user });
}


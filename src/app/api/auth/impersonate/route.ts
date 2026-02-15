import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/database/prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/admin/users', request.url));

  const record = await prisma.impersonationToken.findUnique({
    where: { token },
    include: { User_ImpersonatedUser: true }
  });

  if (!record || record.expires_at < new Date()) {
    return NextResponse.redirect(new URL('/admin/users', request.url));
  }

  const sessionToken = await encode({
    token: {
      sub: record.user_id,
      role: record.User_ImpersonatedUser.role
    },
    secret: process.env.NEXTAUTH_SECRET ?? ''
  });

  await prisma.impersonationToken.delete({ where: { token } });

  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  return response;
}

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/database/prisma/client';
import { AuthService } from './auth.service';
import { issueRefreshToken, rotateRefreshToken } from './refresh-token.service';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 2 },
  jwt: { maxAge: 60 * 60 * 2 },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: '2FA Code', type: 'text' },
        recovery_code: { label: 'Recovery Code', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        const form = new FormData();
        form.set('email', credentials.email ?? '');
        form.set('password', credentials.password ?? '');
        if (credentials.otp) form.set('otp', credentials.otp);
        if (credentials.recovery_code) form.set('recovery_code', credentials.recovery_code);

        const auth = new AuthService();
        const result = await auth.login(form, new Headers(req.headers as HeadersInit));
        if (!result.ok || !result.user) {
          // Minimal diagnostics to unblock dev: shows whether OTP cookie likely reached NextAuth.
          const hdrs = new Headers(req.headers as HeadersInit);
          const cookieHeader = hdrs.get('cookie') ?? '';
          const m = cookieHeader.match(/(?:^|;\s*)saas_otp_challenge=([^;]+)/);
          const rawChallenge = m ? m[1] : null;
          const decodedChallenge = rawChallenge ? decodeURIComponent(rawChallenge) : null;
          const hasChallengeCookie = Boolean(rawChallenge);
          console.warn('[auth] credentials authorize failed', {
            email: credentials.email,
            hasOtp: Boolean(credentials.otp),
            hasChallengeCookie,
            challengeLen: decodedChallenge?.length ?? null,
            challengePrefix: decodedChallenge ? decodedChallenge.slice(0, 18) : null,
            errors: (result as any).errors
          });
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role
        } as { id: string; email: string; role: string };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial login
      if (user) {
        const refresh = await issueRefreshToken(user.id);
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? 'USER';
        token.refreshTokenId = refresh.recordId;
        token.expiresAt = Date.now() + 15 * 60 * 1000;
        return token;
      }

      // Refresh access when expired
      if (token.expiresAt && Date.now() > Number(token.expiresAt)) {
        if (token.refreshTokenId) {
          const next = await rotateRefreshToken(String(token.refreshTokenId));
          if (next) {
            token.refreshTokenId = next.recordId;
            token.expiresAt = Date.now() + 15 * 60 * 1000;
            return token;
          }
        }
        return { ...token, error: 'RefreshFailed' };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'USER';
      }
      return session;
    },
    async redirect({ baseUrl, url }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    }
  },
  events: {
    async signOut({ token }) {
      if (!token?.refreshTokenId) return;
      await prisma.refreshToken.update({
        where: { id: String(token.refreshTokenId) },
        data: { revoked_at: new Date() }
      });
    }
  }
};

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getSetting, setSetting } from '@/services/site-settings.service';
import { zSanitizedString } from '@/lib/http/sanitize';

const schema = z.object({
  activeTheme: zSanitizedString().min(1),
  customHtml: zSanitizedString().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const active = await getSetting('active_theme');
  const html = await getSetting('theme_html');
  return NextResponse.json({
    ok: true,
    activeTheme: active?.value ?? 'default',
    customHtml: html?.value ?? ''
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await setSetting('active_theme', parsed.data.activeTheme);
  if (parsed.data.customHtml !== undefined) {
    await setSetting('theme_html', parsed.data.customHtml);
  }

  return NextResponse.json({ ok: true });
}

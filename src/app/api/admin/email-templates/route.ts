import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getSetting, setSetting } from '@/services/site-settings.service';
import { zSanitizedString } from '@/lib/http/sanitize';

const schema = z.object({
  templates: z.array(
    z.object({
      key: zSanitizedString().min(1),
      subject: zSanitizedString().min(1),
      body: zSanitizedString().min(1)
    })
  )
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const setting = await getSetting('email_templates');
  return NextResponse.json({ ok: true, templates: setting?.value ?? [] });
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

  await setSetting('email_templates', parsed.data.templates);
  return NextResponse.json({ ok: true });
}

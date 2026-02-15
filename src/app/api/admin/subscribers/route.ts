import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getSetting, setSetting } from '@/services/site-settings.service';
import { zSanitizedString } from '@/lib/http/sanitize';
import { sendEmail } from '@/services/email.service';

const addSchema = z.object({
  email: zSanitizedString().email()
});

const sendSchema = z.object({
  subject: zSanitizedString().min(1),
  message: zSanitizedString().min(1)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const setting = await getSetting('subscribers');
  return NextResponse.json({ ok: true, subscribers: setting?.value ?? [] });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();

  if (body?.email) {
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const setting = await getSetting('subscribers');
    const list = Array.isArray(setting?.value) ? setting?.value : [];
    if (!list.includes(parsed.data.email)) list.push(parsed.data.email);
    await setSetting('subscribers', list);
    return NextResponse.json({ ok: true, subscribers: list });
  }

  const parsedSend = sendSchema.safeParse(body);
  if (!parsedSend.success) {
    return NextResponse.json({ ok: false, errors: parsedSend.error.flatten().fieldErrors }, { status: 400 });
  }

  const setting = await getSetting('subscribers');
  const list = Array.isArray(setting?.value)
    ? (setting.value as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  await Promise.all(
    list.map(email =>
      sendEmail({ to: email, subject: parsedSend.data.subject, text: parsedSend.data.message })
    )
  );

  return NextResponse.json({ ok: true, sent: list.length });
}

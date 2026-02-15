import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/services/auth.service';
import { withMonitoring } from '@/lib/monitoring';

export async function POST(request: Request) {
  const formData = await request.formData();
  const auth = new AuthService();
  const result = await withMonitoring(() => auth.register(formData), { route: 'auth/register' });

  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

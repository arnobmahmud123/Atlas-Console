import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/services/auth.service';
import { withMonitoring } from '@/lib/monitoring';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let formData: FormData;
  if (contentType.includes('application/json')) {
    const body = await request.json();
    formData = new FormData();
    for (const [key, value] of Object.entries(body ?? {})) {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    }
  } else {
    formData = await request.formData();
  }
  const auth = new AuthService();
  const result = await withMonitoring(
    () => auth.login(formData, request.headers),
    { route: 'auth/login' }
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        errors: result.errors,
        message: (result as any).message,
        requiresOtp: (result as any).requiresOtp,
        devCode: (result as any).devCode
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, user: result.user });
}

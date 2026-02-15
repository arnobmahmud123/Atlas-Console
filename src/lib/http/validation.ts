import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function validateJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }>
{
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, errors: { body: ['Invalid JSON'] } }, { status: 400 })
    };
  }
}

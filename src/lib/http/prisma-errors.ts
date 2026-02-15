export function getPrismaMigrationMessage(error: unknown, fallback: string) {
  const e = error as { code?: string; message?: string; meta?: { target?: string[] } };
  if (e?.code === 'P2021' || e?.code === 'P2022') {
    return {
      status: 503,
      message: 'Database migration pending. Run `npx prisma migrate dev` (or `npx prisma migrate deploy`) and reload.'
    };
  }
  if (e?.code === 'P1001' || (e?.message ?? '').includes("Can't reach database server")) {
    return {
      status: 503,
      message: 'Database is unreachable. Start PostgreSQL and retry.'
    };
  }
  if (e?.code === 'P2002') {
    const target = e?.meta?.target ?? [];
    if (Array.isArray(target) && target.includes('reference')) {
      return {
        status: 409,
        message: 'This approval was already processed. Refresh and check current status.'
      };
    }
  }
  return { status: 400, message: e?.message ?? fallback };
}

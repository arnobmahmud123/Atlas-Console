import type { NextRequest } from 'next/server';
import type { RedisClientType } from 'redis';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 120;
let client: RedisClientType | null = null;

function isEdgeRuntime() {
  return (globalThis as unknown as { EdgeRuntime?: string }).EdgeRuntime || process.env.NEXT_RUNTIME === 'edge';
}

async function getClient(): Promise<RedisClientType> {
  if (client) return client;
  const { createClient } = await import('redis');
  client = createClient({ url: process.env.REDIS_URL });
  return client;
}

function getClientKey(req: NextRequest, userId?: string) {
  if (userId) return `user:${userId}`;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip')?.trim();
  return `ip:${ip ?? 'unknown'}`;
}

export async function rateLimit(req: NextRequest, userId?: string) {
  if (isEdgeRuntime()) {
    return { ok: true, remaining: MAX_REQUESTS, resetAt: Date.now() + WINDOW_SECONDS * 1000 };
  }
  try {
    const redis = await getClient();
    if (!redis.isOpen) {
      await redis.connect();
    }
    const key = `rl:${getClientKey(req, userId)}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    const remaining = Math.max(0, MAX_REQUESTS - count);
    const resetAt = Date.now() + WINDOW_SECONDS * 1000;

    if (count > MAX_REQUESTS) {
      return { ok: false, remaining: 0, resetAt };
    }

    return { ok: true, remaining, resetAt };
  } catch {
    return { ok: true, remaining: MAX_REQUESTS, resetAt: Date.now() + WINDOW_SECONDS * 1000 };
  }
}

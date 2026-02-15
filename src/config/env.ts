import { z } from 'zod';

const baseSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  APP_ENCRYPTION_KEY: z.string().min(1),
  CRON_API_KEY: z.string().min(1),
  YOUTUBE_CHANNEL_ID: z.string().min(1).optional(),
  YOUTUBE_LIVE_VIDEO_ID: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

const devSchema = baseSchema;
const prodSchema = baseSchema;

export type Env = z.infer<typeof baseSchema>;

export function loadEnv(): Env {
  const raw = {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
    CRON_API_KEY: process.env.CRON_API_KEY,
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID,
    YOUTUBE_LIVE_VIDEO_ID: process.env.YOUTUBE_LIVE_VIDEO_ID,
    NODE_ENV: process.env.NODE_ENV
  };

  const schema = process.env.NODE_ENV === 'production' ? prodSchema : devSchema;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    // Fail fast on startup when required env vars are missing/invalid.
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }

  return parsed.data;
}

export const env = loadEnv();

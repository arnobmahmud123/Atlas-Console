import { prisma } from '@/database/prisma/client';

const LOCK_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 100;

function hashKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

async function tryAdvisoryLock(lockKey: number) {
  const result = await prisma.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(${lockKey}) AS locked
  `;
  return result[0]?.locked ?? false;
}

async function releaseAdvisoryLock(lockKey: number) {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${lockKey})`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withWalletLock<T>(walletKey: string, fn: () => Promise<T>) {
  const lockKey = hashKey(walletKey);
  const started = Date.now();

  while (Date.now() - started < LOCK_TIMEOUT_MS) {
    const locked = await tryAdvisoryLock(lockKey);
    if (locked) {
      try {
        return await fn();
      } finally {
        await releaseAdvisoryLock(lockKey);
      }
    }
    await sleep(RETRY_DELAY_MS);
  }

  throw new Error('Wallet lock timeout');
}

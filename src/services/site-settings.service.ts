import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function getSetting(key: string) {
  try {
    return await prisma.siteSettings.findUnique({ where: { key } });
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: unknown) {
  const now = new Date();
  const jsonValue = value as Prisma.InputJsonValue;
  return prisma.siteSettings.upsert({
    where: { key },
    update: { value: jsonValue, updated_at: now },
    create: { id: crypto.randomUUID(), key, value: jsonValue, updated_at: now }
  });
}

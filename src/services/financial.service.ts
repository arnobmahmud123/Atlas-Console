import { prisma } from '@/database/prisma/client';
import type { Prisma } from '@prisma/client';

export type PrismaTx = Prisma.TransactionClient;

export async function runFinancialOperation<T>(fn: (tx: PrismaTx) => Promise<T>) {
  return prisma.$transaction(async tx => fn(tx));
}

import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const [users, investments, deposits] = await Promise.all([
    prisma.user.count(),
    prisma.investmentPosition.count({ where: { status: 'ACTIVE' } }),
    prisma.deposit.count({ where: { status: 'SUCCESS' } })
  ]);

  return NextResponse.json({
    ok: true,
    users,
    activeInvestments: investments,
    successfulDeposits: deposits
  });
}

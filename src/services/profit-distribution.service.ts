import crypto from 'crypto';
import {
  Prisma,
  type ProfitBatchCommentType,
  type ProfitBatchStatus,
  type ProfitPeriodType,
  type PrismaClient,
  type UserRole
} from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { getOrCreateUserMainLedgerAccount, getSystemLedgerAccountByNo } from '@/services/ledger-accounts.service';

type Tx = Prisma.TransactionClient | PrismaClient;

type ReferralLevelConfig = { level: number; percent: number };

function getDefaultLevels(): ReferralLevelConfig[] {
  return [
    { level: 1, percent: 5 },
    { level: 2, percent: 3 },
    { level: 3, percent: 2 },
    { level: 4, percent: 1 },
    { level: 5, percent: 0.5 }
  ];
}

function computeProfitBreakdown(input: Prisma.Decimal) {
  const totalExpenses = new Prisma.Decimal(0);
  const grossRevenue = input;
  const netProfit = grossRevenue.minus(totalExpenses);
  return {
    grossRevenue,
    totalExpenses,
    netProfit,
    businessReserveAmount: netProfit.mul(0.4),
    investorPoolAmount: netProfit.mul(0.59),
    referralPoolAmount: netProfit.mul(0.01)
  };
}

async function getReferralLevels(tx: Tx) {
  const setting = await tx.siteSettings.findUnique({ where: { key: 'referral_commissions' } });
  const raw = (setting?.value ?? {}) as any;

  if (Array.isArray(raw.levels)) {
    const levels = raw.levels
      .map((x: any) => ({ level: Number(x.level), percent: Number(x.percent) }))
      .filter((x: ReferralLevelConfig) => Number.isFinite(x.level) && x.level > 0 && Number.isFinite(x.percent) && x.percent > 0)
      .sort((a: ReferralLevelConfig, b: ReferralLevelConfig) => a.level - b.level);
    if (levels.length) return levels;
  }

  if (Array.isArray(raw.levelPercents)) {
    const max = Number(raw.maxLevels ?? raw.levelPercents.length);
    const levels = raw.levelPercents
      .slice(0, Math.max(0, max))
      .map((percent: any, idx: number) => ({ level: idx + 1, percent: Number(percent) }))
      .filter((x: ReferralLevelConfig) => Number.isFinite(x.percent) && x.percent > 0);
    if (levels.length) return levels;
  }

  return getDefaultLevels();
}

export async function createProfitBatch(params: {
  periodType: ProfitPeriodType;
  periodStart: Date;
  periodEnd: Date;
  totalProfit: Prisma.Decimal;
  createdByAccountantId: string;
  submissionAttachmentUrl?: string | null;
  submittedNote?: string | null;
}) {
  const now = new Date();
  const breakdown = computeProfitBreakdown(params.totalProfit);
  const batch = await prisma.profitBatch.create({
    data: {
      id: crypto.randomUUID(),
      period_type: params.periodType,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      total_profit: params.totalProfit,
      gross_revenue: breakdown.grossRevenue,
      total_expenses: breakdown.totalExpenses,
      net_profit: breakdown.netProfit,
      business_reserve_amount: breakdown.businessReserveAmount,
      investor_pool_amount: breakdown.investorPoolAmount,
      referral_pool_amount: breakdown.referralPoolAmount,
      submission_attachment_url: params.submissionAttachmentUrl ?? null,
      submitted_note: params.submittedNote ?? null,
      status: 'PENDING_ADMIN_FINAL',
      created_by_accountant_id: params.createdByAccountantId,
      updated_at: now
    }
  });
  await prisma.profitBatchComment.create({
    data: {
      id: crypto.randomUUID(),
      batch_id: batch.id,
      author_id: params.createdByAccountantId,
      author_role: 'ACCOUNTANT',
      type: 'SUBMISSION',
      message: params.submittedNote?.trim() || 'Initial submission',
      attachment_url: params.submissionAttachmentUrl ?? null,
      updated_at: now
    }
  });
  return batch;
}

async function awardReferralCommissionsFromProfit(tx: Tx, params: {
  downlineUserId: string;
  sourceId: string;
  amount: Prisma.Decimal;
}) {
  if (params.amount.lte(0)) return { ok: true as const, created: 0 };

  const existing = await tx.commissionEvent.findUnique({
    where: {
      source_type_source_id: {
        source_type: 'PROFIT_DISTRIBUTION',
        source_id: params.sourceId
      }
    }
  });
  if (existing) return { ok: true as const, created: 0 };

  const now = new Date();
  const event = await tx.commissionEvent.create({
    data: {
      id: crypto.randomUUID(),
      source_type: 'PROFIT_DISTRIBUTION',
      source_id: params.sourceId,
      downline_user_id: params.downlineUserId,
      amount: params.amount,
      updated_at: now
    }
  });

  const levels: ReferralLevelConfig[] = await getReferralLevels(tx);
  if (!levels.length) return { ok: true as const, created: 0 };

  const chain = await tx.referral.findMany({
    where: { user_id: params.downlineUserId },
    orderBy: { level: 'asc' }
  });
  if (!chain.length) return { ok: true as const, created: 0 };

  const commissionPool = await getSystemLedgerAccountByNo(tx, '4100');
  if (!commissionPool) throw new Error('System referral ledger account 4100 missing');

  let created = 0;
  for (const row of chain) {
    const levelCfg = levels.find((l: ReferralLevelConfig) => l.level === row.level);
    if (!levelCfg) continue;

    const percent = new Prisma.Decimal(levelCfg.percent);
    const amount = params.amount.mul(percent).div(100);
    if (amount.lte(0)) continue;

    const uplineMain = await getOrCreateUserMainLedgerAccount(tx, row.parent_user_id);
    const wallet = await tx.wallet.findUnique({ where: { id: uplineMain.wallet_id } });
    if (!wallet) throw new Error('Upline wallet not found');

    const txNow = new Date();
    const commissionRef = `profit_commission:${event.id}:${row.level}:${row.parent_user_id}`;
    let commissionTx = await tx.transaction.findUnique({ where: { reference: commissionRef } });
    if (!commissionTx) {
      commissionTx = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: row.parent_user_id,
          wallet_id: wallet.id,
          type: 'DIVIDEND',
          amount,
          currency: wallet.currency,
          status: 'SUCCESS',
          reference: commissionRef,
          updated_at: txNow
        }
      });
    }

    const existingEntries = await tx.ledgerEntry.count({ where: { transaction_id: commissionTx.id } });
    if (existingEntries < 2) {
      await createDoubleEntryTransaction(tx, {
        debitAccountId: uplineMain.id,
        creditAccountId: commissionPool.id,
        amount,
        referenceId: commissionTx.id,
        userId: row.parent_user_id
      });
    }

    const existingCommission = await tx.referralCommission.findFirst({
      where: {
        event_id: event.id,
        upline_user_id: row.parent_user_id,
        downline_user_id: params.downlineUserId,
        level: row.level
      },
      select: { id: true }
    });
    if (!existingCommission) {
      await tx.referralCommission.create({
        data: {
          id: crypto.randomUUID(),
          event_id: event.id,
          upline_user_id: row.parent_user_id,
          downline_user_id: params.downlineUserId,
          level: row.level,
          percent,
          amount,
          transaction_id: commissionTx.id,
          updated_at: txNow
        }
      });
    }
    created += 1;
  }

  return { ok: true as const, created };
}

export async function finalApproveProfitBatch(batchId: string, adminId: string) {
  return prisma.$transaction(async tx => {
    const batch = await tx.profitBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Profit batch not found');
    if (batch.status !== 'PENDING_ADMIN_FINAL') {
      throw new Error(`Batch cannot be approved from status ${batch.status}`);
    }

    const grouped = await tx.investmentPosition.groupBy({
      by: ['user_id'],
      where: { status: 'ACTIVE' },
      _sum: { invested_amount: true }
    });

    const rows = grouped
      .map(g => ({ userId: g.user_id, investment: g._sum.invested_amount ?? new Prisma.Decimal(0) }))
      .filter(x => x.investment.gt(0));

    const totalInvestment = rows.reduce((acc, r) => acc.plus(r.investment), new Prisma.Decimal(0));
    if (totalInvestment.lte(0)) throw new Error('No active investments found to allocate profit');

    const now = new Date();
    const rewardPool = await getSystemLedgerAccountByNo(tx, '4000');
    if (!rewardPool) throw new Error('System reward ledger account 4000 missing');

    const investorPool = batch.investor_pool_amount.gt(0) ? batch.investor_pool_amount : batch.total_profit;
    for (const row of rows) {
      const sharePercent = row.investment.div(totalInvestment).mul(100);
      const profitAmount = investorPool.mul(row.investment).div(totalInvestment);
      if (profitAmount.lte(0)) continue;

      await tx.profitAllocation.upsert({
        where: { batch_id_user_id: { batch_id: batch.id, user_id: row.userId } },
        update: {
          investment_snapshot: row.investment,
          share_percent: sharePercent,
          profit_amount: profitAmount,
          updated_at: now
        },
        create: {
          id: crypto.randomUUID(),
          batch_id: batch.id,
          user_id: row.userId,
          investment_snapshot: row.investment,
          share_percent: sharePercent,
          profit_amount: profitAmount,
          status: 'PENDING',
          updated_at: now
        }
      });
    }

    const allocations = await tx.profitAllocation.findMany({
      where: { batch_id: batch.id, status: 'PENDING' },
      orderBy: { created_at: 'asc' }
    });

    let creditedCount = 0;
    for (const allocation of allocations) {
      const userMain = await getOrCreateUserMainLedgerAccount(tx, allocation.user_id);
      const wallet = await tx.wallet.findUnique({ where: { id: userMain.wallet_id } });
      if (!wallet) throw new Error('Wallet not found for allocation user');

      const txNow = new Date();
      const allocationRef = `profit_batch:${batch.id}:allocation:${allocation.id}`;
      let userProfitTx = await tx.transaction.findUnique({ where: { reference: allocationRef } });
      if (!userProfitTx) {
        userProfitTx = await tx.transaction.create({
          data: {
            id: crypto.randomUUID(),
            user_id: allocation.user_id,
            wallet_id: wallet.id,
            type: 'DIVIDEND',
            amount: allocation.profit_amount,
            currency: wallet.currency,
            status: 'SUCCESS',
            reference: allocationRef,
            updated_at: txNow
          }
        });
      }

      const existingEntries = await tx.ledgerEntry.count({ where: { transaction_id: userProfitTx.id } });
      if (existingEntries < 2) {
        await createDoubleEntryTransaction(tx, {
          debitAccountId: userMain.id,
          creditAccountId: rewardPool.id,
          amount: allocation.profit_amount,
          referenceId: userProfitTx.id,
          userId: allocation.user_id
        });
      }

      await tx.profitAllocation.update({
        where: { id: allocation.id },
        data: { status: 'CREDITED', credited_at: txNow, updated_at: txNow }
      });

      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          user_id: allocation.user_id,
          type: 'SUCCESS',
          title: 'Profit Credited',
          message: `Your profit of ${allocation.profit_amount.toString()} has been credited.`,
          href: '/dashboard/notifications'
        }
      });

      await awardReferralCommissionsFromProfit(tx, {
        downlineUserId: allocation.user_id,
        sourceId: allocation.id,
        amount: allocation.profit_amount
      });

      creditedCount += 1;
    }

    const updated = await tx.profitBatch.update({
      where: { id: batch.id },
      data: {
        status: 'APPROVED',
        finalized_by_admin_id: adminId,
        total_investment_amount: totalInvestment,
        recipient_count: creditedCount,
        updated_at: now
      }
    });

    return { batch: updated, creditedCount, totalInvestment };
  });
}

export async function addProfitBatchComment(params: {
  batchId: string;
  authorId: string;
  authorRole: UserRole;
  type: ProfitBatchCommentType;
  message: string;
  attachmentUrl?: string | null;
}) {
  const now = new Date();
  return prisma.profitBatchComment.create({
    data: {
      id: crypto.randomUUID(),
      batch_id: params.batchId,
      author_id: params.authorId,
      author_role: params.authorRole,
      type: params.type,
      message: params.message,
      attachment_url: params.attachmentUrl ?? null,
      updated_at: now
    }
  });
}

export async function resubmitProfitBatch(params: {
  batchId: string;
  accountantId: string;
  totalProfit?: Prisma.Decimal;
  submissionAttachmentUrl?: string | null;
  submittedNote?: string | null;
}) {
  const now = new Date();
  return prisma.$transaction(async tx => {
    const batch = await tx.profitBatch.findUnique({ where: { id: params.batchId } });
    if (!batch) throw new Error('Profit batch not found');
    if (batch.created_by_accountant_id !== params.accountantId) throw new Error('Forbidden');
    if (batch.status === 'APPROVED') throw new Error('Approved batch cannot be resubmitted');

    const nextTotalProfit = params.totalProfit ?? batch.total_profit;
    const breakdown = computeProfitBreakdown(nextTotalProfit);
    const updated = await tx.profitBatch.update({
      where: { id: params.batchId },
      data: {
        status: 'PENDING_ADMIN_FINAL',
        total_profit: nextTotalProfit,
        gross_revenue: breakdown.grossRevenue,
        total_expenses: breakdown.totalExpenses,
        net_profit: breakdown.netProfit,
        business_reserve_amount: breakdown.businessReserveAmount,
        investor_pool_amount: breakdown.investorPoolAmount,
        referral_pool_amount: breakdown.referralPoolAmount,
        submission_attachment_url: params.submissionAttachmentUrl ?? batch.submission_attachment_url,
        submitted_note: params.submittedNote ?? batch.submitted_note,
        finalized_by_admin_id: null,
        last_feedback_at: null,
        revision_count: { increment: 1 },
        updated_at: now
      }
    });

    await tx.profitBatchComment.create({
      data: {
        id: crypto.randomUUID(),
        batch_id: params.batchId,
        author_id: params.accountantId,
        author_role: 'ACCOUNTANT',
        type: 'RESUBMIT',
        message: params.submittedNote?.trim() || 'Resubmitted with updates',
        attachment_url: params.submissionAttachmentUrl ?? null,
        updated_at: now
      }
    });

    return updated;
  });
}

export async function finalRejectProfitBatch(params: {
  batchId: string;
  adminId: string;
  reason?: string;
  attachmentUrl?: string | null;
  adjustedTotalProfit?: Prisma.Decimal;
  mode: 'REQUEST_CHANGES' | 'FINAL_REJECT';
}) {
  const now = new Date();
  return prisma.$transaction(async tx => {
    const batch = await tx.profitBatch.findUnique({ where: { id: params.batchId } });
    if (!batch) throw new Error('Profit batch not found');
    if (batch.status !== 'PENDING_ADMIN_FINAL') {
      throw new Error(`Batch cannot be reviewed from status ${batch.status}`);
    }

    const nextTotalProfit = params.adjustedTotalProfit ?? batch.total_profit;
    const breakdown = computeProfitBreakdown(nextTotalProfit);
    const updated = await tx.profitBatch.update({
      where: { id: params.batchId },
      data: {
        status: 'REJECTED' as ProfitBatchStatus,
        finalized_by_admin_id: params.adminId,
        total_profit: nextTotalProfit,
        gross_revenue: breakdown.grossRevenue,
        total_expenses: breakdown.totalExpenses,
        net_profit: breakdown.netProfit,
        business_reserve_amount: breakdown.businessReserveAmount,
        investor_pool_amount: breakdown.investorPoolAmount,
        referral_pool_amount: breakdown.referralPoolAmount,
        last_feedback_at: now,
        updated_at: now
      }
    });

    await tx.profitBatchComment.create({
      data: {
        id: crypto.randomUUID(),
        batch_id: params.batchId,
        author_id: params.adminId,
        author_role: 'ADMIN',
        type: params.mode,
        message: params.reason?.trim() || (params.mode === 'FINAL_REJECT' ? 'Final rejected by admin' : 'Please revise and resubmit'),
        attachment_url: params.attachmentUrl ?? null,
        updated_at: now
      }
    });

    return updated;
  });
}

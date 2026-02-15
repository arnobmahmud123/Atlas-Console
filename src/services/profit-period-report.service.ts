import ExcelJS from 'exceljs';
import { prisma } from '@/database/prisma/client';

type AccessScope = 'full' | 'me';
export type ProfitRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY';

type BuildPeriodReportInput = {
  range: ProfitRange;
  scope: AccessScope;
  viewerUserId?: string;
  anchorDate?: Date;
  customStart?: Date;
  customEnd?: Date;
};

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getNameOrEmail(user: { email: string | null; UserProfile?: { full_name: string | null } | null }) {
  return user.UserProfile?.full_name?.trim() || user.email || '';
}

function getPeriodWindow(range: ProfitRange, anchor = new Date()) {
  const d = new Date(anchor);
  const start = new Date(d);
  const end = new Date(d);

  if (range === 'DAILY') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'WEEKLY') {
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    start.setDate(d.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'MONTHLY') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'HALF_YEARLY') {
    const month = d.getMonth();
    const halfStartMonth = month < 6 ? 0 : 6;
    start.setMonth(halfStartMonth, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(halfStartMonth + 6, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function buildProfitPeriodReport(params: BuildPeriodReportInput) {
  const start = params.customStart ?? getPeriodWindow(params.range, params.anchorDate ?? new Date()).start;
  const end = params.customEnd ?? getPeriodWindow(params.range, params.anchorDate ?? new Date()).end;
  const periodLabel = params.customStart || params.customEnd ? 'CUSTOM' : params.range;

  const batches = await prisma.profitBatch.findMany({
    where: {
      status: 'APPROVED',
      period_start: { gte: start },
      period_end: { lte: end }
    },
    orderBy: { period_start: 'asc' },
    include: { FinalizedByAdmin: { select: { email: true } } }
  });

  const batchIds = batches.map(b => b.id);

  const allBatchAllocations = await prisma.profitAllocation.findMany({
    where: { batch_id: { in: batchIds.length ? batchIds : ['__none__'] } },
    select: { id: true }
  });
  const allAllocationIds = allBatchAllocations.map(a => a.id);

  const allocations = await prisma.profitAllocation.findMany({
    where:
      params.scope === 'me'
        ? { batch_id: { in: batchIds.length ? batchIds : ['__none__'] }, user_id: params.viewerUserId }
        : { batch_id: { in: batchIds.length ? batchIds : ['__none__'] } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          UserProfile: { select: { full_name: true } }
        }
      },
      batch: { select: { id: true, period_start: true, period_end: true } }
    },
    orderBy: { created_at: 'asc' }
  });

  const commissions = await prisma.referralCommission.findMany({
    where:
      params.scope === 'me'
        ? {
            upline_user_id: params.viewerUserId,
            event: {
              source_type: 'PROFIT_DISTRIBUTION',
              source_id: { in: allAllocationIds.length ? allAllocationIds : ['__none__'] }
            }
          }
        : {
            event: {
              source_type: 'PROFIT_DISTRIBUTION',
              source_id: { in: allAllocationIds.length ? allAllocationIds : ['__none__'] }
            }
          },
    include: {
      upline_user: { select: { id: true, email: true, UserProfile: { select: { full_name: true } } } },
      downline_user: { select: { id: true, email: true, UserProfile: { select: { full_name: true } } } }
    },
    orderBy: { created_at: 'asc' }
  });

  const grossRevenue = batches.reduce((sum, b) => sum + toNumber(b.gross_revenue), 0);
  const totalExpenses = batches.reduce((sum, b) => sum + toNumber(b.total_expenses), 0);
  const netProfit = batches.reduce((sum, b) => sum + toNumber(b.net_profit), 0);
  const businessReserve = batches.reduce((sum, b) => sum + toNumber(b.business_reserve_amount), 0);
  const investorPool = batches.reduce((sum, b) => sum + toNumber(b.investor_pool_amount), 0);
  const referralPool = batches.reduce((sum, b) => sum + toNumber(b.referral_pool_amount), 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SaaS App';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Business Summary');
  const investorSheet = workbook.addWorksheet('Investor Profit Distribution');
  const referralSheet = workbook.addWorksheet('Referral Earnings');

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  summarySheet.getRow(1).font = { bold: true };

  const summaryRows: Array<[string, string | number]> =
    params.scope === 'me'
      ? [
          ['Period Type', periodLabel],
          ['Period Start', toIsoDate(start)],
          ['Period End', toIsoDate(end)],
          ['Net Profit', netProfit],
          ['My Profit Amount', allocations.reduce((sum, row) => sum + toNumber(row.profit_amount), 0)],
          ['My Referral Earnings', commissions.reduce((sum, row) => sum + toNumber(row.amount), 0)],
          ['Approved Batches', batches.length]
        ]
      : [
          ['Period Type', periodLabel],
          ['Period Start', toIsoDate(start)],
          ['Period End', toIsoDate(end)],
          ['Gross Revenue', grossRevenue],
          ['Total Expenses', totalExpenses],
          ['Net Profit', netProfit],
          ['Business Reserve Amount', businessReserve],
          ['Investor Pool Amount', investorPool],
          ['Referral Pool Amount', referralPool],
          ['Approved Batches', batches.length],
          ['Approved By', Array.from(new Set(batches.map(b => b.FinalizedByAdmin?.email).filter(Boolean))).join(', ')]
        ];

  summaryRows.forEach(([metric, value]) => summarySheet.addRow({ metric, value }));

  investorSheet.columns = [
    { header: 'Batch ID', key: 'batch_id', width: 38 },
    { header: 'User ID', key: 'user_id', width: 40 },
    { header: 'Name / Email', key: 'name', width: 30 },
    { header: 'Investment Snapshot', key: 'investment_snapshot', width: 20 },
    { header: 'Share %', key: 'share_percent', width: 12 },
    { header: 'Profit Amount', key: 'profit_amount', width: 16 },
    { header: 'Credited At', key: 'credited_at', width: 22 }
  ];
  investorSheet.getRow(1).font = { bold: true };
  allocations.forEach(row => {
    investorSheet.addRow({
      batch_id: row.batch_id,
      user_id: row.user_id,
      name: getNameOrEmail(row.user),
      investment_snapshot: toNumber(row.investment_snapshot),
      share_percent: toNumber(row.share_percent),
      profit_amount: toNumber(row.profit_amount),
      credited_at: row.credited_at ? new Date(row.credited_at).toISOString() : ''
    });
  });

  referralSheet.columns = [
    { header: 'Referrer User ID', key: 'upline_user_id', width: 40 },
    { header: 'Referrer Name/Email', key: 'upline_name', width: 30 },
    { header: 'Downline User ID', key: 'downline_user_id', width: 40 },
    { header: 'Level', key: 'level', width: 10 },
    { header: 'Percent', key: 'percent', width: 12 },
    { header: 'Base Profit Amount', key: 'base_profit', width: 18 },
    { header: 'Commission Amount', key: 'commission', width: 18 },
    { header: 'Created At', key: 'created_at', width: 22 }
  ];
  referralSheet.getRow(1).font = { bold: true };
  commissions.forEach(row => {
    const percent = toNumber(row.percent);
    const amount = toNumber(row.amount);
    const baseProfit = percent > 0 ? (amount * 100) / percent : 0;
    referralSheet.addRow({
      upline_user_id: row.upline_user_id,
      upline_name: getNameOrEmail(row.upline_user),
      downline_user_id: row.downline_user_id,
      level: row.level,
      percent,
      base_profit: baseProfit,
      commission: amount,
      created_at: new Date(row.created_at).toISOString()
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `profit-report-${periodLabel.toLowerCase()}-${toIsoDate(end)}.xlsx`;
  return { buffer, filename };
}

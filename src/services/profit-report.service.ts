import ExcelJS from 'exceljs';
import { prisma } from '@/database/prisma/client';

type AccessScope = 'full' | 'me';

type BuildReportInput = {
  batchId: string;
  scope: AccessScope;
  viewerUserId?: string;
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

function formatFilenameDate(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function getNameOrEmail(user: { email: string | null; UserProfile?: { full_name: string | null } | null }) {
  return user.UserProfile?.full_name?.trim() || user.email || '';
}

export async function buildProfitReport(params: BuildReportInput) {
  const batch = await prisma.profitBatch.findUnique({
    where: { id: params.batchId },
    include: {
      FinalizedByAdmin: { select: { email: true } }
    }
  });
  if (!batch || batch.status !== 'APPROVED') {
    return null;
  }

  const allocationWhere =
    params.scope === 'me'
      ? { batch_id: params.batchId, user_id: params.viewerUserId }
      : { batch_id: params.batchId };

  const allocations = await prisma.profitAllocation.findMany({
    where: allocationWhere,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          UserProfile: { select: { full_name: true } }
        }
      }
    },
    orderBy: { created_at: 'asc' }
  });

  const allBatchAllocations = await prisma.profitAllocation.findMany({
    where: { batch_id: params.batchId },
    select: { id: true }
  });
  const batchAllocationIds = allBatchAllocations.map(a => a.id);

  const commissionWhere =
    params.scope === 'me'
      ? {
          upline_user_id: params.viewerUserId,
          event: {
            source_type: 'PROFIT_DISTRIBUTION' as const,
            source_id: { in: batchAllocationIds.length ? batchAllocationIds : ['__none__'] }
          }
        }
      : {
          event: {
            source_type: 'PROFIT_DISTRIBUTION' as const,
            source_id: { in: batchAllocationIds.length ? batchAllocationIds : ['__none__'] }
          }
        };

  const commissions = await prisma.referralCommission.findMany({
    where: commissionWhere,
    include: {
      upline_user: {
        select: { id: true, email: true, UserProfile: { select: { full_name: true } } }
      },
      downline_user: {
        select: { id: true, email: true, UserProfile: { select: { full_name: true } } }
      }
    },
    orderBy: { created_at: 'asc' }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SaaS App';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Business Summary');
  const investorSheet = workbook.addWorksheet('Investor Profit Distribution');
  const referralSheet = workbook.addWorksheet('Referral Earnings');

  const grossRevenue = toNumber(batch.gross_revenue);
  const totalExpenses = toNumber(batch.total_expenses);
  const netProfit = toNumber(batch.net_profit);
  const businessReserve = toNumber(batch.business_reserve_amount);
  const investorPool = toNumber(batch.investor_pool_amount);
  const referralPool = toNumber(batch.referral_pool_amount);
  const myAllocationTotal = allocations.reduce((sum, row) => sum + toNumber(row.profit_amount), 0);
  const myReferralTotal = commissions.reduce((sum, row) => sum + toNumber(row.amount), 0);

  const summaryRows: Array<[string, string | number]> =
    params.scope === 'me'
      ? [
          ['Period Type', batch.period_type],
          ['Period Start', toIsoDate(batch.period_start)],
          ['Period End', toIsoDate(batch.period_end)],
          ['Net Profit', netProfit],
          ['My Profit Amount', myAllocationTotal],
          ['My Referral Earnings', myReferralTotal],
          ['Approved By', batch.FinalizedByAdmin?.email ?? ''],
          ['Approved At', batch.updated_at.toISOString()]
        ]
      : [
          ['Period Type', batch.period_type],
          ['Period Start', toIsoDate(batch.period_start)],
          ['Period End', toIsoDate(batch.period_end)],
          ['Gross Revenue', grossRevenue],
          ['Total Expenses', totalExpenses],
          ['Net Profit', netProfit],
          ['Business Reserve Amount', businessReserve],
          ['Investor Pool Amount', investorPool],
          ['Referral Pool Amount', referralPool],
          ['Approved By', batch.FinalizedByAdmin?.email ?? ''],
          ['Approved At', batch.updated_at.toISOString()]
        ];

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  summarySheet.getRow(1).font = { bold: true };
  summaryRows.forEach(([metric, value]) => summarySheet.addRow({ metric, value }));
  summarySheet.eachRow((row, index) => {
    if (index > 1 && typeof row.getCell(2).value === 'number') {
      row.getCell(2).numFmt = '#,##0.00';
    }
  });

  investorSheet.columns = [
    { header: 'User ID', key: 'user_id', width: 40 },
    { header: 'Name / Email', key: 'name', width: 32 },
    { header: 'Investment Snapshot', key: 'investment_snapshot', width: 20 },
    { header: 'Share %', key: 'share_percent', width: 12 },
    { header: 'Profit Amount', key: 'profit_amount', width: 16 },
    { header: 'Credited At', key: 'credited_at', width: 22 }
  ];
  investorSheet.getRow(1).font = { bold: true };
  allocations.forEach(row => {
    investorSheet.addRow({
      user_id: row.user_id,
      name: getNameOrEmail(row.user),
      investment_snapshot: toNumber(row.investment_snapshot),
      share_percent: toNumber(row.share_percent),
      profit_amount: toNumber(row.profit_amount),
      credited_at: row.credited_at ? new Date(row.credited_at).toISOString() : ''
    });
  });
  investorSheet.eachRow((row, index) => {
    if (index === 1) return;
    row.getCell(3).numFmt = '#,##0.00';
    row.getCell(4).numFmt = '0.00';
    row.getCell(5).numFmt = '#,##0.00';
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
    referralSheet.addRow({
      upline_user_id: row.upline_user_id,
      upline_name: getNameOrEmail(row.upline_user),
      downline_user_id: row.downline_user_id,
      level: row.level,
      percent: toNumber(row.percent),
      base_profit: toNumber(row.percent) > 0 ? (toNumber(row.amount) * 100) / toNumber(row.percent) : 0,
      commission: toNumber(row.amount),
      created_at: new Date(row.created_at).toISOString()
    });
  });
  referralSheet.eachRow((row, index) => {
    if (index === 1) return;
    row.getCell(5).numFmt = '0.00';
    row.getCell(6).numFmt = '#,##0.00';
    row.getCell(7).numFmt = '#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `profit-report-${formatFilenameDate(batch.period_end)}.xlsx`;

  return { buffer, filename };
}

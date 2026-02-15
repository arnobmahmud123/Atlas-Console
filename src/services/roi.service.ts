import type { InvestmentPlan, InvestmentPosition, RoiType } from '@prisma/client';
import { Prisma } from '@prisma/client';

export function calculateDailyRoi(
  position: Pick<InvestmentPosition, 'invested_amount'>,
  plan: Pick<InvestmentPlan, 'roi_type' | 'roi_value'>
) {
  if (plan.roi_type === 'FIXED') {
    return new Prisma.Decimal(position.invested_amount).mul(plan.roi_value);
  }

  if (plan.roi_type === 'VARIABLE') {
    // Placeholder logic for variable ROI
    return new Prisma.Decimal(position.invested_amount).mul(plan.roi_value);
  }

  // ADMIN_MANUAL
  return new Prisma.Decimal(0);
}

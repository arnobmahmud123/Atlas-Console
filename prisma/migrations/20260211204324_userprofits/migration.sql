-- CreateEnum
CREATE TYPE "ProfitPeriodType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "ProfitBatchStatus" AS ENUM ('DRAFT', 'PENDING_ADMIN_FINAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfitAllocationStatus" AS ENUM ('PENDING', 'CREDITED');

-- CreateEnum
CREATE TYPE "CommissionSourceType" AS ENUM ('PROFIT_DISTRIBUTION');

-- CreateTable
CREATE TABLE "ProfitBatch" (
    "id" UUID NOT NULL,
    "period_type" "ProfitPeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_profit" DECIMAL(65,30) NOT NULL,
    "total_investment_amount" DECIMAL(65,30),
    "recipient_count" INTEGER,
    "status" "ProfitBatchStatus" NOT NULL,
    "created_by_accountant_id" UUID NOT NULL,
    "finalized_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitAllocation" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "investment_snapshot" DECIMAL(65,30) NOT NULL,
    "share_percent" DECIMAL(65,30) NOT NULL,
    "profit_amount" DECIMAL(65,30) NOT NULL,
    "status" "ProfitAllocationStatus" NOT NULL,
    "credited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionEvent" (
    "id" UUID NOT NULL,
    "source_type" "CommissionSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "downline_user_id" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "upline_user_id" UUID NOT NULL,
    "downline_user_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "percent" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfitBatch_status_idx" ON "ProfitBatch"("status");

-- CreateIndex
CREATE INDEX "ProfitBatch_period_start_period_end_idx" ON "ProfitBatch"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "ProfitBatch_created_by_accountant_id_idx" ON "ProfitBatch"("created_by_accountant_id");

-- CreateIndex
CREATE INDEX "ProfitBatch_finalized_by_admin_id_idx" ON "ProfitBatch"("finalized_by_admin_id");

-- CreateIndex
CREATE INDEX "ProfitAllocation_status_idx" ON "ProfitAllocation"("status");

-- CreateIndex
CREATE INDEX "ProfitAllocation_batch_id_idx" ON "ProfitAllocation"("batch_id");

-- CreateIndex
CREATE INDEX "ProfitAllocation_user_id_idx" ON "ProfitAllocation"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitAllocation_batch_id_user_id_key" ON "ProfitAllocation"("batch_id", "user_id");

-- CreateIndex
CREATE INDEX "CommissionEvent_downline_user_id_idx" ON "CommissionEvent"("downline_user_id");

-- CreateIndex
CREATE INDEX "CommissionEvent_source_type_source_id_idx" ON "CommissionEvent"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionEvent_source_type_source_id_key" ON "CommissionEvent"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "ReferralCommission_event_id_idx" ON "ReferralCommission"("event_id");

-- CreateIndex
CREATE INDEX "ReferralCommission_upline_user_id_idx" ON "ReferralCommission"("upline_user_id");

-- CreateIndex
CREATE INDEX "ReferralCommission_downline_user_id_idx" ON "ReferralCommission"("downline_user_id");

-- CreateIndex
CREATE INDEX "ReferralCommission_transaction_id_idx" ON "ReferralCommission"("transaction_id");

-- AddForeignKey
ALTER TABLE "ProfitBatch" ADD CONSTRAINT "ProfitBatch_created_by_accountant_id_fkey" FOREIGN KEY ("created_by_accountant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitBatch" ADD CONSTRAINT "ProfitBatch_finalized_by_admin_id_fkey" FOREIGN KEY ("finalized_by_admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitAllocation" ADD CONSTRAINT "ProfitAllocation_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "ProfitBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitAllocation" ADD CONSTRAINT "ProfitAllocation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEvent" ADD CONSTRAINT "CommissionEvent_downline_user_id_fkey" FOREIGN KEY ("downline_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "CommissionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_upline_user_id_fkey" FOREIGN KEY ("upline_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_downline_user_id_fkey" FOREIGN KEY ("downline_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

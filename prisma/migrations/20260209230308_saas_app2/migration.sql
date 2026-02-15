-- CreateEnum
CREATE TYPE "MobileMoneyMethod" AS ENUM ('BKASH', 'NAGAD');

-- CreateEnum
CREATE TYPE "DepositRequestStatus" AS ENUM ('PENDING_ACCOUNTANT', 'PENDING_ADMIN_FINAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING_ACCOUNTANT', 'PENDING_ADMIN_FINAL', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ACCOUNTANT';

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method" "MobileMoneyMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "receipt_file_url" TEXT,
    "status" "DepositRequestStatus" NOT NULL,
    "reviewed_by_accountant_id" UUID,
    "finalized_by_admin_id" UUID,
    "notes" TEXT,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method" "MobileMoneyMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payout_number" TEXT NOT NULL,
    "status" "WithdrawalRequestStatus" NOT NULL,
    "reviewed_by_accountant_id" UUID,
    "finalized_by_admin_id" UUID,
    "notes" TEXT,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepositRequest_created_at_idx" ON "DepositRequest"("created_at");

-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_user_id_idx" ON "DepositRequest"("user_id");

-- CreateIndex
CREATE INDEX "DepositRequest_reviewed_by_accountant_id_idx" ON "DepositRequest"("reviewed_by_accountant_id");

-- CreateIndex
CREATE INDEX "DepositRequest_finalized_by_admin_id_idx" ON "DepositRequest"("finalized_by_admin_id");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_created_at_idx" ON "WithdrawalRequest"("created_at");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_user_id_idx" ON "WithdrawalRequest"("user_id");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_reviewed_by_accountant_id_idx" ON "WithdrawalRequest"("reviewed_by_accountant_id");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_finalized_by_admin_id_idx" ON "WithdrawalRequest"("finalized_by_admin_id");

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_reviewed_by_accountant_id_fkey" FOREIGN KEY ("reviewed_by_accountant_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_finalized_by_admin_id_fkey" FOREIGN KEY ("finalized_by_admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_reviewed_by_accountant_id_fkey" FOREIGN KEY ("reviewed_by_accountant_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_finalized_by_admin_id_fkey" FOREIGN KEY ("finalized_by_admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

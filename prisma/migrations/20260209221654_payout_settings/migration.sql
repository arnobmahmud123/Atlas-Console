-- CreateEnum
CREATE TYPE "MobileBankingProvider" AS ENUM ('BKASH', 'NAGAD');

-- AlterEnum
ALTER TYPE "WithdrawMethod" ADD VALUE 'MOBILE_BANKING';

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "mobile_provider" "MobileBankingProvider",
ADD COLUMN     "payout_account" TEXT;

-- CreateTable
CREATE TABLE "PayoutAccount" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_type" "WithdrawMethod" NOT NULL,
    "mobile_provider" "MobileBankingProvider",
    "account_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAccount_user_id_key" ON "PayoutAccount"("user_id");

-- CreateIndex
CREATE INDEX "PayoutAccount_deleted_at_idx" ON "PayoutAccount"("deleted_at");

-- CreateIndex
CREATE INDEX "PayoutAccount_user_id_idx" ON "PayoutAccount"("user_id");

-- AddForeignKey
ALTER TABLE "PayoutAccount" ADD CONSTRAINT "PayoutAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('MAIN', 'PROFIT');

-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'UPDATE_PROFILE', 'DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'REFERRAL', 'OTHER');

-- AlterTable
ALTER TABLE "InvestmentPlan" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "type" "WalletType" NOT NULL DEFAULT 'MAIN';

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "UserActivityType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivityLog_user_id_idx" ON "UserActivityLog"("user_id");

-- CreateIndex
CREATE INDEX "UserActivityLog_type_idx" ON "UserActivityLog"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationToken_token_key" ON "ImpersonationToken"("token");

-- CreateIndex
CREATE INDEX "ImpersonationToken_user_id_idx" ON "ImpersonationToken"("user_id");

-- CreateIndex
CREATE INDEX "ImpersonationToken_created_by_idx" ON "ImpersonationToken"("created_by");

-- CreateIndex
CREATE INDEX "ImpersonationToken_expires_at_idx" ON "ImpersonationToken"("expires_at");

-- CreateIndex
CREATE INDEX "InvestmentPlan_deleted_at_idx" ON "InvestmentPlan"("deleted_at");

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationToken" ADD CONSTRAINT "ImpersonationToken_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Notification"
  ADD COLUMN "href" TEXT,
  ADD COLUMN "attachment_url" TEXT;

-- AlterTable
ALTER TABLE "WithdrawalRequest"
  ADD COLUMN "payout_confirmed_at" TIMESTAMP(3),
  ADD COLUMN "payout_confirmed_by_accountant_id" UUID,
  ADD COLUMN "payout_screenshot_url" TEXT,
  ADD COLUMN "payout_note" TEXT;

-- CreateIndex
CREATE INDEX "WithdrawalRequest_payout_confirmed_by_accountant_id_idx"
  ON "WithdrawalRequest"("payout_confirmed_by_accountant_id");

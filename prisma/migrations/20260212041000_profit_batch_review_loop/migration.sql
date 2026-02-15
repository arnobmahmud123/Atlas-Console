-- AlterTable
ALTER TABLE "ProfitBatch"
  ADD COLUMN "submission_attachment_url" TEXT,
  ADD COLUMN "submitted_note" TEXT,
  ADD COLUMN "revision_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_feedback_at" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "ProfitBatchCommentType" AS ENUM ('SUBMISSION', 'REQUEST_CHANGES', 'FINAL_REJECT', 'RESUBMIT', 'NOTE');

-- CreateTable
CREATE TABLE "ProfitBatchComment" (
  "id" UUID NOT NULL,
  "batch_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "author_role" "UserRole" NOT NULL,
  "type" "ProfitBatchCommentType" NOT NULL,
  "message" TEXT NOT NULL,
  "attachment_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfitBatchComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfitBatchComment_batch_id_idx" ON "ProfitBatchComment"("batch_id");
CREATE INDEX "ProfitBatchComment_author_id_idx" ON "ProfitBatchComment"("author_id");
CREATE INDEX "ProfitBatchComment_created_at_idx" ON "ProfitBatchComment"("created_at");

-- AddForeignKey
ALTER TABLE "ProfitBatchComment" ADD CONSTRAINT "ProfitBatchComment_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "ProfitBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProfitBatchComment" ADD CONSTRAINT "ProfitBatchComment_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

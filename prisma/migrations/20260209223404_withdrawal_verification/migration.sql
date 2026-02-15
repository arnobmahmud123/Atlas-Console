-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('WITHDRAWAL');

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailOtp_created_at_idx" ON "EmailOtp"("created_at");

-- CreateIndex
CREATE INDEX "EmailOtp_expires_at_idx" ON "EmailOtp"("expires_at");

-- CreateIndex
CREATE INDEX "EmailOtp_purpose_idx" ON "EmailOtp"("purpose");

-- CreateIndex
CREATE INDEX "EmailOtp_user_id_idx" ON "EmailOtp"("user_id");

-- AddForeignKey
ALTER TABLE "EmailOtp" ADD CONSTRAINT "EmailOtp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

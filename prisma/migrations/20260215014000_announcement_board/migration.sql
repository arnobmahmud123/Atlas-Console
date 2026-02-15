-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'PROFIT_DELAY', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "Announcement" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Announcement_created_by_idx" ON "Announcement"("created_by");
CREATE INDEX "Announcement_is_active_idx" ON "Announcement"("is_active");
CREATE INDEX "Announcement_published_at_idx" ON "Announcement"("published_at");

-- FK
ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

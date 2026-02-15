-- CreateEnum
CREATE TYPE "DocumentCenterCategory" AS ENUM ('BUSINESS_LICENSE', 'SHOP_LEASE', 'TAX_FILE', 'OTHER');

-- CreateTable
CREATE TABLE "DocumentCenterItem" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "category" "DocumentCenterCategory" NOT NULL,
  "file_url" TEXT NOT NULL,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "uploaded_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentCenterItem_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "DocumentCenterItem_category_idx" ON "DocumentCenterItem"("category");
CREATE INDEX "DocumentCenterItem_created_at_idx" ON "DocumentCenterItem"("created_at");
CREATE INDEX "DocumentCenterItem_is_active_idx" ON "DocumentCenterItem"("is_active");
CREATE INDEX "DocumentCenterItem_uploaded_by_idx" ON "DocumentCenterItem"("uploaded_by");

-- Foreign key
ALTER TABLE "DocumentCenterItem"
  ADD CONSTRAINT "DocumentCenterItem_uploaded_by_fkey"
  FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

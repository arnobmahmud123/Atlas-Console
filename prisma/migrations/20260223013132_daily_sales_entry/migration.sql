-- CreateEnum
CREATE TYPE "DailySalesSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "DailySalesSession" (
    "id" UUID NOT NULL,
    "business_date" DATE NOT NULL,
    "status" "DailySalesSessionStatus" NOT NULL DEFAULT 'OPEN',
    "day_sales_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "day_profit_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "day_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_items_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" UUID,
    "reopened_at" TIMESTAMP(3),
    "reopened_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesLineItem" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "selling_price" DECIMAL(65,30) NOT NULL,
    "cost_price" DECIMAL(65,30) NOT NULL,
    "line_total" DECIMAL(65,30) NOT NULL,
    "line_profit" DECIMAL(65,30) NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSession_business_date_key" ON "DailySalesSession"("business_date");

-- CreateIndex
CREATE INDEX "DailySalesSession_business_date_idx" ON "DailySalesSession"("business_date");

-- CreateIndex
CREATE INDEX "DailySalesSession_status_idx" ON "DailySalesSession"("status");

-- CreateIndex
CREATE INDEX "DailySalesLineItem_created_at_idx" ON "DailySalesLineItem"("created_at");

-- CreateIndex
CREATE INDEX "DailySalesLineItem_product_id_idx" ON "DailySalesLineItem"("product_id");

-- CreateIndex
CREATE INDEX "DailySalesLineItem_session_id_idx" ON "DailySalesLineItem"("session_id");

-- AddForeignKey
ALTER TABLE "DailySalesLineItem" ADD CONSTRAINT "DailySalesLineItem_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "DailySalesSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

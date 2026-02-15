ALTER TABLE "ProfitBatch"
  ADD COLUMN "gross_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "total_expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "net_profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "business_reserve_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "investor_pool_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "referral_pool_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "ProfitBatch"
SET
  "gross_revenue" = "total_profit",
  "total_expenses" = 0,
  "net_profit" = "total_profit",
  "business_reserve_amount" = "total_profit" * 0.40,
  "investor_pool_amount" = "total_profit" * 0.59,
  "referral_pool_amount" = "total_profit" * 0.01;

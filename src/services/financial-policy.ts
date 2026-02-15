/**
 * Financial policy guardrails:
 * - Never store or update wallet balances directly.
 * - Always record ledger entries.
 * - Always run financial operations inside a database transaction.
 */
export const FINANCIAL_POLICY = {
  useLedgerEntries: true,
  forbidDirectWalletBalance: true,
  requireTransaction: true
};

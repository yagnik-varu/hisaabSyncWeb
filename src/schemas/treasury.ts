import { z } from "zod";

import { isValidAmount } from "@/lib/money";

/** Reused by every money input: positive, max 2 decimals, max 10 integer digits (DECIMAL(12,2)). */
export const amountField = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .refine(isValidAmount, "Enter a positive amount with up to 2 decimals, e.g. 1450.50")
  .refine((v) => v.split(".")[0].replace(/^0+/, "").length <= 10, "Amount is too large");

export const adjustmentSchema = z.object({
  transactionType: z.enum(["CREDIT", "DEBIT"]),
  amount: amountField,
  description: z
    .string()
    .trim()
    .min(
      5,
      "Explain the adjustment (at least 5 characters). It's shown in the ledger and audit log.",
    )
    .max(500, "At most 500 characters"),
});
export type AdjustmentValues = z.infer<typeof adjustmentSchema>;

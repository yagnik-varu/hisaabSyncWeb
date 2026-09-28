import { z } from "zod";

import { amountField } from "@/schemas/treasury";

export const contributionSchema = z.object({
  amount: amountField,
  note: z.string().trim().max(500, "At most 500 characters"),
});
export type ContributionValues = z.infer<typeof contributionSchema>;

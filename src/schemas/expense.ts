import { z } from "zod";

import { safeExternalUrl } from "@/lib/url";
import { amountField } from "@/schemas/treasury";

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  amount: amountField,
  title: z.string().trim().min(1, "Title is required").max(255, "At most 255 characters"),
  description: z.string().trim().max(1000, "At most 1000 characters"),
  receiptUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || safeExternalUrl(v) !== null, "Enter a valid http(s) link"),
});
export type ExpenseValues = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "At most 100 characters"),
});
export type CategoryValues = z.infer<typeof categorySchema>;

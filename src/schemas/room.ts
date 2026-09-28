import { z } from "zod";

/** Currencies offered in the create-room form (backend accepts any code ≤ 10 chars). */
export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
] as const;

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Room name is required").max(100, "At most 100 characters"),
  description: z.string().trim().max(500, "At most 500 characters"),
  currencyCode: z.string().min(1).max(10),
  allowNegativeTreasury: z.boolean(),
});
export type CreateRoomValues = z.infer<typeof createRoomSchema>;

/** Room codes are generated as 6–8 chars of A–Z/0–9 (seed data uses e.g. "FLAT402"). */
export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,20}$/, "Codes are 4–20 letters or digits, e.g. FLAT402"),
});
export type JoinRoomValues = z.infer<typeof joinRoomSchema>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The backend doesn't validate :roomId as a UUID (invalid ids → 500), so we check first. */
export function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

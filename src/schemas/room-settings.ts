import { z } from "zod";

export const roomSettingsSchema = z.object({
  name: z.string().trim().min(1, "Room name is required").max(100, "At most 100 characters"),
  description: z.string().trim().max(500, "At most 500 characters"),
  allowNegativeTreasury: z.boolean(),
});
export type RoomSettingsValues = z.infer<typeof roomSettingsSchema>;
